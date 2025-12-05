import { AlertCircleIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/card';

export interface ToolErrorVisualizerProps {
  errorText: string;
  title?: string;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Generic error visualizer component for tool errors.
 * Provides a consistent error UI that can be customized for specific use cases.
 */
export function ToolErrorVisualizer({
  errorText,
  title = 'Error',
  description = 'An error occurred while executing this operation.',
  children,
}: ToolErrorVisualizerProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircleIcon className="text-destructive size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">
              {typeof description === 'string' ? description : description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <div className="rounded-lg border border-destructive/20 bg-background p-4">
          <pre className="text-destructive text-sm whitespace-pre-wrap break-words">
            {errorText}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

