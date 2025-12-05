import {
  FileSpreadsheetIcon,
  EyeIcon,
  TableIcon,
  ViewIcon,
  Loader2Icon,
} from 'lucide-react';
import { Badge } from '../../shadcn/badge';
import { Button } from '../../shadcn/button';
import { Card, CardContent, CardHeader } from '../../shadcn/card';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

export interface AvailableSheet {
  name: string;
  type: 'view' | 'table';
}

export interface AvailableSheetsData {
  sheets: AvailableSheet[];
  message: string;
}

interface AvailableSheetsVisualizerProps {
  data: AvailableSheetsData;
  onViewSheet?: (sheetName: string) => void;
  isRequestInProgress?: boolean;
  hideViewButtons?: boolean;
}

export function AvailableSheetsVisualizer({
  data,
  onViewSheet,
  isRequestInProgress = false,
  hideViewButtons = false,
}: AvailableSheetsVisualizerProps) {
  const { sheets, message } = data;
  const [clickedSheet, setClickedSheet] = useState<string | null>(null);

  const handleViewClick = (sheetName: string) => {
    if (isRequestInProgress || clickedSheet) {
      return; // Block if request is in progress or a sheet was already clicked
    }
    setClickedSheet(sheetName);
    onViewSheet?.(sheetName);
  };

  // Reset clicked sheet when request completes
  useEffect(() => {
    if (!isRequestInProgress && clickedSheet) {
      setClickedSheet(null);
    }
  }, [isRequestInProgress, clickedSheet]);

  if (sheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <FileSpreadsheetIcon className="text-muted-foreground size-8" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold">No sheets registered</p>
          <p className="text-muted-foreground text-sm max-w-sm">
            Register a Google Sheet to start querying and visualizing your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <FileSpreadsheetIcon className="text-primary size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Available Sheets</h3>
            <p className="text-muted-foreground text-xs">
              {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
      </div>

      {/* Sheets Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sheets.map((sheet) => {
          const isClicked = clickedSheet === sheet.name;
          const isDisabled = isRequestInProgress || (clickedSheet !== null && !isClicked);
          const TypeIcon = sheet.type === 'view' ? ViewIcon : TableIcon;

          return (
            <Card
              key={sheet.name}
              className={cn(
                'group relative overflow-hidden transition-all duration-200',
                isDisabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:shadow-md hover:border-primary/20 cursor-pointer',
                isClicked && 'ring-2 ring-primary ring-offset-2',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                        isClicked
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-primary/10 text-primary group-hover:bg-primary/20',
                      )}
                    >
                      <FileSpreadsheetIcon className="size-6" />
                    </div>

                    {/* Sheet Info */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className={cn(
                          'truncate text-sm font-semibold',
                          isClicked && 'text-primary',
                        )}
                      >
                        {sheet.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <TypeIcon className="text-muted-foreground size-3" />
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal capitalize"
                        >
                          {sheet.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {onViewSheet && !hideViewButtons && (
                  <Button
                    variant={isClicked ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    disabled={isDisabled}
                    onClick={() => handleViewClick(sheet.name)}
                  >
                    {isClicked ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <EyeIcon className="mr-2 size-4" />
                        View Sheet
                      </>
                    )}
                  </Button>
                )}
              </CardContent>

              {/* Loading Overlay */}
              {isClicked && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Message */}
      {message && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}

