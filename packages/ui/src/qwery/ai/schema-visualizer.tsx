'use client';

import * as React from 'react';
import { Database, Table2, Columns } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SchemaColumn {
  columnName: string;
  columnType: string;
}

export interface SchemaTable {
  tableName: string;
  columns: SchemaColumn[];
}

export interface SchemaData {
  databaseName: string;
  schemaName: string;
  tables: SchemaTable[];
}

export interface SchemaVisualizerProps {
  schema: SchemaData;
  className?: string;
}

/**
 * Specialized component for visualizing database schema information
 */
export function SchemaVisualizer({
  schema,
  className,
}: SchemaVisualizerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Schema Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Database Schema
          </h4>
        </div>
        <div className="text-sm text-muted-foreground pl-6">
          <span className="font-medium">{schema.databaseName}</span>
          {schema.schemaName && schema.schemaName !== schema.databaseName && (
            <span> / {schema.schemaName}</span>
          )}
        </div>
      </div>

      {/* Tables */}
      {schema.tables.map((table, tableIndex) => (
        <div key={tableIndex} className="space-y-2">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            <h5 className="text-sm font-semibold text-foreground">
              {table.tableName}
            </h5>
            <span className="text-xs text-muted-foreground">
              ({table.columns.length} column{table.columns.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Columns Table */}
          <div className="bg-muted/50 max-w-full min-w-0 overflow-hidden rounded-md">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Columns className="h-3 w-3" />
                        Column Name
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Data Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column, colIndex) => (
                    <tr
                      key={colIndex}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2 text-sm font-medium">
                        {column.columnName}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground font-mono">
                        {column.columnType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

