'use client';

import {
  useMemo,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import QweryAgentUI from '@qwery/ui/agent-ui';
import { SUPPORTED_MODELS, transportFactory } from '@qwery/agent-factory-sdk';
import { MessageOutput, UsageOutput } from '@qwery/domain/usecases';
import { convertMessages } from '~/lib/utils/messages-converter';
import { useWorkspace } from '~/lib/context/workspace-context';
import { getUsageKey, useGetUsage } from '~/lib/queries/use-get-usage';
import { QweryContextProps } from 'node_modules/@qwery/ui/src/qwery/ai/context';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getAllExtensionMetadata } from '@qwery/extensions-loader';
import { useGetDatasourcesByProjectId } from '~/lib/queries/use-get-datasources';
import type { DatasourceItem } from '@qwery/ui/ai';
import { useGetConversationBySlug } from '~/lib/queries/use-get-conversations';
import { useUpdateConversation } from '~/lib/mutations/use-conversation';
import { useNotebookSidebar } from '~/lib/context/notebook-sidebar-context';

type SendMessageFn = (message: { text: string }, options?: { body?: Record<string, unknown> }) => Promise<void> & {
  setMessages?: (messages: any[] | ((prev: any[]) => any[])) => void;
};

export interface AgentUIWrapperRef {
  sendMessage: (text: string) => void | Promise<void>;
}

export interface SidebarControl {
  open: () => void;
  sendMessage?: (text: string) => void;
}

export interface AgentUIWrapperProps {
  conversationSlug: string;
  initialMessages?: MessageOutput[];
}

const convertUsage = (usage: UsageOutput[] | undefined): QweryContextProps => {
  if (!usage || usage.length === 0) {
    return {
      usedTokens: 0,
      maxTokens: 0,
    };
  }

  const aggregated = usage.reduce(
    (acc, curr) => ({
      inputTokens: acc.inputTokens + curr.inputTokens,
      outputTokens: acc.outputTokens + curr.outputTokens,
      totalTokens: acc.totalTokens + curr.totalTokens,
      reasoningTokens: acc.reasoningTokens + curr.reasoningTokens,
      cachedInputTokens: acc.cachedInputTokens + curr.cachedInputTokens,
      maxContextSize: Math.max(acc.maxContextSize, curr.contextSize),
      modelId: curr.model,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
      cachedInputTokens: 0,
      maxContextSize: 128_000,
      modelId: '',
    },
  );

  return {
    usedTokens: aggregated.totalTokens,
    maxTokens: aggregated.maxContextSize,
    modelId: aggregated.modelId || undefined,
    usage: {
      inputTokens: aggregated.inputTokens,
      outputTokens: aggregated.outputTokens,
      totalTokens: aggregated.totalTokens,
      reasoningTokens: aggregated.reasoningTokens,
      cachedInputTokens: aggregated.cachedInputTokens,
    },
  };
};

export const AgentUIWrapper = forwardRef<
  AgentUIWrapperRef,
  AgentUIWrapperProps
>(function AgentUIWrapper({ conversationSlug, initialMessages }, ref) {
  const sendMessageRef = useRef<((text: string) => void) | null>(null);
  const internalSendMessageRef = useRef<SendMessageFn | null>(null);
  const setMessagesRef = useRef<((messages: any[] | ((prev: any[]) => any[])) => void) | null>(null);
  const currentModelRef = useRef<string>(SUPPORTED_MODELS[0]?.value ?? 'azure/gpt-5-mini');
  const { repositories, workspace } = useWorkspace();
  const { data: usage } = useGetUsage(
    repositories.usage,
    repositories.conversation,
    conversationSlug,
    workspace.userId,
  );
  const queryClient = useQueryClient();
  const { getCellDatasource, clearCellDatasource } = useNotebookSidebar();

  // Load current conversation to get existing datasources
  const { data: conversation } = useGetConversationBySlug(
    repositories.conversation,
    conversationSlug,
  );

  // Get cell datasource from notebook context (if opened from a cell)
  const cellDatasource = getCellDatasource();

  // Derive selected datasources from conversation
  const conversationDatasources = useMemo(
    () => conversation?.datasources || [],
    [conversation?.datasources],
  );

  // Track pending user changes (cleared after successful mutation)
  const [pendingDatasources, setPendingDatasources] = useState<string[] | null>(
    null,
  );

  // Mutation to update conversation datasources
  const updateConversation = useUpdateConversation(repositories.conversation);

  // Update conversation when cell datasource is provided (initial setup)
  // This runs once when cellDatasource is first set, before any messages are sent
  useEffect(() => {
    if (cellDatasource && conversation?.id && !conversationDatasources.includes(cellDatasource)) {
      // Update conversation to include cell datasource immediately
      // This ensures the datasource is set before the message is sent
      updateConversation.mutate(
        {
          id: conversation.id,
          datasources: [cellDatasource],
          updatedBy: workspace.username || workspace.userId || 'system',
        },
        {
          onSuccess: () => {
            // Set pending datasources to ensure UI reflects the change immediately
            setPendingDatasources([cellDatasource]);
          },
        },
      );
    } else if (cellDatasource && !conversation?.id) {
      // If conversation not loaded yet, set pending datasources for immediate UI update
      setPendingDatasources([cellDatasource]);
    }
  }, [cellDatasource, conversation?.id, conversationDatasources, updateConversation, workspace.username, workspace.userId]);

  // Priority for display: cellDatasource > pending datasources > conversation datasources
  // This ensures the notebook cell's datasource is shown in the UI immediately
  // cellDatasource is cleared when user manually changes selection or after first message
  const selectedDatasources = useMemo(() => {
    // If cellDatasource is set, show it in the UI (user can still change it)
    if (cellDatasource) {
      return [cellDatasource];
    }
    // Otherwise use pending datasources or conversation datasources
    return pendingDatasources !== null ? pendingDatasources : conversationDatasources;
  }, [cellDatasource, pendingDatasources, conversationDatasources]);

  // Fetch datasources for the current project
  const datasources = useGetDatasourcesByProjectId(
    repositories.datasource,
    workspace.projectId || '',
    { enabled: !!workspace.projectId },
  );

  // Fetch extension metadata for datasource icons
  const { data: pluginMetadata = [] } = useQuery({
    queryKey: ['all-plugin-metadata'],
    queryFn: () => getAllExtensionMetadata(),
    staleTime: 60 * 1000,
  });

  const pluginLogoMap = useMemo(() => {
    const map = new Map<string, string>();
    pluginMetadata.forEach((plugin) => {
      if (plugin?.id && plugin.logo) {
        map.set(plugin.id, plugin.logo);
      }
    });
    return map;
  }, [pluginMetadata]);

  // Convert datasources to DatasourceItem format
  const datasourceItems = useMemo<DatasourceItem[]>(() => {
    if (!datasources.data) return [];
    return datasources.data.map((ds) => ({
      id: ds.id,
      name: ds.name,
      slug: ds.slug,
      datasource_provider: ds.datasource_provider,
    }));
  }, [datasources.data]);

  const transport = useMemo(
    () => (model: string) => {
      return transportFactory(conversationSlug, model, repositories);
    },
    [conversationSlug, repositories],
  );

  // Handle sendMessage and model from QweryAgentUI
  const handleSendMessageReady = useCallback(
    (sendMessageFn: SendMessageFn, model: string) => {
      internalSendMessageRef.current = sendMessageFn;
      currentModelRef.current = model;
      
      // Store setMessages if available
      if ((sendMessageFn as any).setMessages) {
        setMessagesRef.current = (sendMessageFn as any).setMessages;
      }
      
      // Create wrapper that uses cellDatasource for initial message, then selectedDatasources
      // This function is stable and doesn't need to be recreated on every datasource change
      sendMessageRef.current = async (text: string) => {
        if (internalSendMessageRef.current) {
          // CRITICAL: ALWAYS check getCellDatasource() directly, not selectedDatasources
          // selectedDatasources might be stale or not updated yet
          const currentCellDs = getCellDatasource();
          
          // Determine datasources to use - prioritize cellDatasource
          const datasourcesToUse = currentCellDs 
            ? [currentCellDs] 
            : (selectedDatasources && selectedDatasources.length > 0 ? selectedDatasources : undefined);
          
          // CRITICAL: Update conversation datasources BEFORE sending message
          // The agent uses conversation datasources, not message metadata
          // We must wait for this to complete to ensure the API uses the correct datasource
          if (datasourcesToUse && datasourcesToUse.length > 0 && conversation?.id) {
            // Check if datasources need to be updated by comparing IDs
            const currentSorted = [...conversationDatasources].sort();
            const newSorted = [...datasourcesToUse].sort();
            const datasourcesChanged = 
              currentSorted.length !== newSorted.length ||
              !currentSorted.every((dsId, index) => dsId === newSorted[index]);
            
            if (datasourcesChanged) {
              // Update conversation with new datasources - wait for it to complete
              await new Promise<void>((resolve) => {
                updateConversation.mutate(
                  {
                    id: conversation.id,
                    datasources: datasourcesToUse,
                    updatedBy: workspace.username || workspace.userId || 'system',
                  },
                  {
                    onSuccess: () => {
                      // Set pending datasources after successful update
                      setPendingDatasources(datasourcesToUse);
                      resolve();
                    },
                    onError: (error) => {
                      // Even if update fails, set pending datasources for UI
                      setPendingDatasources(datasourcesToUse);
                      console.error('Failed to update conversation datasources:', error);
                      // Continue anyway - the datasource in the body will still be used
                      resolve();
                    },
                  },
                );
              });
            } else {
              // Datasources already correct, just set pending for UI
              setPendingDatasources(datasourcesToUse);
            }
          } else if (currentCellDs) {
            // If conversation not loaded yet, just set pending datasources
            setPendingDatasources([currentCellDs]);
          }
          
          // Clear cellDatasource after first use so subsequent messages use user's selection
          // But do this AFTER setting pending datasources
          if (currentCellDs) {
            clearCellDatasource();
          }
          
          // Send message with the correct datasource
          const sendPromise = internalSendMessageRef.current(
            { text },
            {
              body: {
                model: currentModelRef.current, // Use the current model from chat interface
                datasources: datasourcesToUse, // This MUST be the correct datasource(s)
              },
            },
          );
          
          // If we have setMessages and datasourcesToUse, update the message metadata after it's created
          // This ensures the UI shows the correct datasource badge immediately
          if (setMessagesRef.current && datasourcesToUse && datasourcesToUse.length > 0) {
            // Use a small delay to ensure the message is created by useChat first
            setTimeout(() => {
              setMessagesRef.current?.((prev: any[]) => {
                // Find the last user message and add metadata if it doesn't have it
                const lastUserMessageIndex = prev.findLastIndex((msg: any) => msg.role === 'user');
                if (lastUserMessageIndex >= 0) {
                  const lastUserMessage = prev[lastUserMessageIndex];
                  // Only update if metadata doesn't already have datasources
                  if (!lastUserMessage.metadata || !(lastUserMessage.metadata as any).datasources) {
                    const updated = [...prev];
                    updated[lastUserMessageIndex] = {
                      ...lastUserMessage,
                      metadata: {
                        ...(lastUserMessage.metadata || {}),
                        datasources: datasourcesToUse,
                        source: 'notebook-cell',
                      },
                    };
                    return updated;
                  }
                }
                return prev;
              });
            }, 50);
          }
        }
      };
    },
    [getCellDatasource, clearCellDatasource, selectedDatasources, conversation?.id, conversationDatasources, updateConversation, workspace.username, workspace.userId],
  );

  useImperativeHandle(
    ref,
    () => ({
      sendMessage: (text: string) => {
        sendMessageRef.current?.(text);
      },
    }),
    [],
  );

  const handleEmitFinish = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: getUsageKey(conversationSlug, workspace.userId),
    });
  }, [queryClient, conversationSlug, workspace.userId]);

  // Handle datasource selection change and save to conversation
  const handleDatasourceSelectionChange = useCallback(
    (datasourceIds: string[]) => {
      // Clear cell datasource when user manually changes selection
      // This allows user to override the notebook cell's datasource
      clearCellDatasource();
      
      // Set pending datasources for immediate UI update
      setPendingDatasources(datasourceIds);

      // Save to conversation if conversation is loaded
      // CRITICAL: Update conversation synchronously to ensure agent uses new datasources
      if (conversation?.id) {
        // Check if datasources actually changed
        const currentSorted = [...(conversationDatasources || [])].sort();
        const newSorted = [...datasourceIds].sort();
        const datasourcesChanged = 
          currentSorted.length !== newSorted.length ||
          !currentSorted.every((dsId, index) => dsId === newSorted[index]);
        
        if (datasourcesChanged) {
          updateConversation.mutate(
            {
              id: conversation.id,
              datasources: datasourceIds,
              updatedBy: workspace.username || workspace.userId || 'system',
            },
            {
              onSuccess: () => {
                // Clear pending state after successful mutation
                setPendingDatasources(null);
              },
            },
          );
        } else {
          // Datasources already match, just clear pending
          setPendingDatasources(null);
        }
      }
    },
    [conversation, conversationDatasources, updateConversation, workspace.username, workspace.userId, clearCellDatasource],
  );

  return (
    <QweryAgentUI
      transport={transport}
      initialMessages={convertMessages(initialMessages)}
      models={SUPPORTED_MODELS as { name: string; value: string }[]}
      usage={convertUsage(usage)}
      emitFinish={handleEmitFinish}
      datasources={datasourceItems}
      selectedDatasources={selectedDatasources}
      onDatasourceSelectionChange={handleDatasourceSelectionChange}
      pluginLogoMap={pluginLogoMap}
      datasourcesLoading={datasources.isLoading}
      onSendMessageReady={handleSendMessageReady}
    />
  );
});
