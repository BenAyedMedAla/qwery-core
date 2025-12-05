'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../shadcn/button';
import { cn } from '../../lib/utils';

export interface DataGridColumn {
  key: string;
  name: string;
  width?: number;
}

export interface DataGridProps {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  pageSize?: number;
  className?: string;
}

/**
 * Minimal paginated data grid component for displaying SQL query results
 * Uses simple pagination to avoid browser overload with thousands of rows
 */
export function DataGrid({
  columns,
  rows,
  pageSize = 50,
  className,
}: DataGridProps) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = rows.slice(startIndex, endIndex);

  React.useEffect(() => {
    // Reset to page 1 when data changes
    setCurrentPage(1);
  }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Data Grid */}
      <div className="bg-muted/50 max-w-full min-w-0 overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIndex) => (
                <tr
                  key={startIndex + rowIndex}
                  className="border-b hover:bg-muted/20 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2 text-sm whitespace-nowrap"
                    >
                      {row[column] !== null && row[column] !== undefined
                        ? String(row[column])
                        : (
                            <span className="text-muted-foreground italic">
                              null
                            </span>
                          )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="text-xs text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, rows.length)} of{' '}
            {rows.length} rows
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="text-xs">Previous</span>
            </Button>
            <div className="text-xs text-muted-foreground min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="h-7 gap-1"
            >
              <span className="text-xs">Next</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

