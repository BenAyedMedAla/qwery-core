import {
  FileSpreadsheetIcon,
  SearchIcon,
  LightbulbIcon,
} from 'lucide-react';
import { Button } from '../../shadcn/button';
import { ToolErrorVisualizer } from './tool-error-visualizer';

export interface ViewSheetErrorProps {
  errorText: string;
  sheetName?: string;
  onRetry?: (correctedSheetName: string) => void;
  availableSheets?: string[];
}

/**
 * Parses error messages to extract helpful information for sheet-related errors
 */
function parseSheetError(errorText: string): {
  isTableNotFound: boolean;
  suggestedSheetName?: string;
  originalSheetName?: string;
} {
  const tableNotFoundRegex = /Table with name\s+["']?(\w+)["']?\s+does not exist/i;
  const suggestionRegex = /Did you mean\s+["']?(\w+)["']?\?/i;

  const tableMatch = errorText.match(tableNotFoundRegex);
  const suggestionMatch = errorText.match(suggestionRegex);

  return {
    isTableNotFound: !!tableMatch,
    originalSheetName: tableMatch?.[1],
    suggestedSheetName: suggestionMatch?.[1],
  };
}

/**
 * Specialized error visualizer for viewSheet tool errors.
 * Handles "sheet not found" errors with helpful suggestions and available sheets.
 */
export function ViewSheetError({
  errorText,
  sheetName,
  onRetry,
  availableSheets = [],
}: ViewSheetErrorProps) {
  const { isTableNotFound, suggestedSheetName, originalSheetName } =
    parseSheetError(errorText);

  const displaySheetName = sheetName || originalSheetName || 'unknown';

  if (isTableNotFound) {
    return (
      <ToolErrorVisualizer
        errorText={errorText}
        title="Sheet Not Found"
        description={`The sheet ${displaySheetName} does not exist in the database.`}
      >
        {suggestedSheetName && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <LightbulbIcon className="text-primary mt-0.5 size-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">
                  Did you mean <span className="font-mono">{suggestedSheetName}</span>?
                </p>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => onRetry(suggestedSheetName)}
                  >
                    <FileSpreadsheetIcon className="mr-2 size-4" />
                    View {suggestedSheetName}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {availableSheets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SearchIcon className="text-muted-foreground size-4" />
              <p className="text-sm font-medium">Available Sheets:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSheets.map((availableSheet) => (
                <Button
                  key={availableSheet}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5 text-xs"
                  onClick={() => onRetry?.(availableSheet)}
                >
                  <FileSpreadsheetIcon className="mr-1.5 size-3" />
                  {availableSheet}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!suggestedSheetName && availableSheets.length === 0 && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-muted-foreground text-xs">
              Try listing available sheets or check the sheet name spelling.
            </p>
          </div>
        )}
      </ToolErrorVisualizer>
    );
  }

  // For other error types, use the generic error visualizer
  return (
    <ToolErrorVisualizer
      errorText={errorText}
      title="Error Viewing Sheet"
      description="An error occurred while trying to view the sheet."
    />
  );
}
