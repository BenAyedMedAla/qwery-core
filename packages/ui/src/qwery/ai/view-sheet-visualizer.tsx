import { DataGrid } from './data-grid';
import { FileSpreadsheetIcon } from 'lucide-react';
import { Badge } from '../../shadcn/badge';

export interface ViewSheetData {
  sheetName: string;
  totalRows: number;
  displayedRows: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  message: string;
}

interface ViewSheetVisualizerProps {
  data: ViewSheetData;
}

export function ViewSheetVisualizer({ data }: ViewSheetVisualizerProps) {
  const { sheetName, totalRows, displayedRows, columns, rows, message } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheetIcon className="text-muted-foreground size-5" />
          <h3 className="text-sm font-semibold">{sheetName}</h3>
          <Badge variant="secondary" className="text-xs">
            {displayedRows} of {totalRows} rows
          </Badge>
        </div>
      </div>

      {message && (
        <p className="text-muted-foreground text-xs">{message}</p>
      )}

      <div className="rounded-md border">
        <DataGrid columns={columns} rows={rows} />
      </div>
    </div>
  );
}

