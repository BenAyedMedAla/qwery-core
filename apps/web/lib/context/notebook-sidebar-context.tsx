'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

type NotebookSidebarContextValue = {
  openSidebar: (conversationSlug: string, options?: { messageToSend?: string; datasourceId?: string }) => void;
  registerSidebarControl: (control: { open: () => void; sendMessage?: (text: string) => void }) => void;
  getCellDatasource: () => string | undefined;
  clearCellDatasource: () => void;
};

const NotebookSidebarContext = createContext<NotebookSidebarContextValue | null>(
  null,
);

export function NotebookSidebarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const sidebarControlRef = useRef<{ open: () => void; sendMessage?: (text: string) => void } | null>(null);
  const cellDatasourceRef = useRef<string | undefined>(undefined);

  const openSidebar = (conversationSlug: string, options?: { messageToSend?: string; datasourceId?: string }) => {
    // Store datasource if provided - MUST be set before opening sidebar
    if (options?.datasourceId) {
      cellDatasourceRef.current = options.datasourceId;
    }
    
    // Update URL with conversation slug
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('conversation', conversationSlug);
    window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
    
    // Directly open sidebar via control
    sidebarControlRef.current?.open();
    
    // If a message is provided, send it after ensuring sidebar is ready
    // The datasource is already set above, so AgentUIWrapper will pick it up
    if (options?.messageToSend && sidebarControlRef.current?.sendMessage) {
      const messageToSend = options.messageToSend;
      const datasourceId = options.datasourceId;
      
      // Use requestAnimationFrame + setTimeout to ensure:
      // 1. Sidebar is fully open and rendered
      // 2. AgentUIWrapper has mounted and can access cellDatasource
      // 3. Datasource is set before message is sent
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Double-check datasource is still set (in case it was cleared)
          if (datasourceId && cellDatasourceRef.current !== datasourceId) {
            cellDatasourceRef.current = datasourceId;
          }
          if (messageToSend) {
            sidebarControlRef.current?.sendMessage?.(messageToSend);
          }
        }, 300);
      });
    }
  };

  const getCellDatasource = () => {
    return cellDatasourceRef.current;
  };

  const clearCellDatasource = () => {
    cellDatasourceRef.current = undefined;
  };

  const registerSidebarControl = (control: { open: () => void; sendMessage?: (text: string) => void }) => {
    sidebarControlRef.current = control;
  };

  return (
    <NotebookSidebarContext.Provider
      value={{
        openSidebar,
        registerSidebarControl,
        getCellDatasource,
        clearCellDatasource,
      }}
    >
      {children}
    </NotebookSidebarContext.Provider>
  );
}

export function useNotebookSidebar() {
  const context = useContext(NotebookSidebarContext);
  if (!context) {
    // Return no-op functions if not in notebook context
    return {
      openSidebar: () => {},
      registerSidebarControl: () => {},
      getCellDatasource: () => undefined,
      clearCellDatasource: () => {},
    };
  }
  return context;
}


