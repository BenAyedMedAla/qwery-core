import { DuckDBInstanceManager } from './duckdb-instance-manager';
import { listAllTables } from './view-registry';

export interface ListAvailableSheetsOptions {
  conversationId: string;
  workspace: string;
}

export interface SheetInfo {
  name: string;
  type: 'view' | 'table' | 'attached_table';
  database?: string; // For attached tables (e.g., 'ds_xxx')
  schema?: string; // For attached tables
  fullPath?: string; // Full qualified path for attached tables (e.g., 'ds_xxx.public.users')
}

export interface ListAvailableSheetsResult {
  sheets: SheetInfo[];
  count: number;
}

export const listAvailableSheets = async (
  opts: ListAvailableSheetsOptions,
): Promise<ListAvailableSheetsResult> => {
  const { conversationId, workspace } = opts;
  const { join } = await import('node:path');
  const dbPath = join(workspace, conversationId, 'database.db');

  // Get all tables/views using view-registry function
  const allTables = await listAllTables(dbPath);

  const sheets: SheetInfo[] = [];

  for (const table of allTables) {
    // Check if it's a fully qualified path (attached database)
    if (table.includes('.')) {
      const parts = table.split('.').filter(Boolean);
      if (parts.length >= 3) {
        // Format: ds_xxx.schema.table
        const database = parts[0];
        const schema = parts[1];
        const tableName = parts.slice(2).join('.');
        sheets.push({
          name: tableName,
          type: 'attached_table',
          database,
          schema,
          fullPath: table,
        });
      } else if (parts.length === 2) {
        // Format: schema.table (less common)
        const schema = parts[0];
        const tableName = parts[1];
        if (schema && tableName) {
          sheets.push({
            name: tableName,
            type: 'attached_table',
            schema,
            fullPath: table,
          });
        }
      } else {
        // Single part - treat as view/table in main database
        sheets.push({
          name: table,
          type: 'view', // Default to view for main database
        });
      }
    } else {
      // Simple name - view or table in main database
      // We'll check if it's a view or table by querying
      const conn = await DuckDBInstanceManager.getConnection(
        conversationId,
        workspace,
      );

      try {
        // Try to determine if it's a view or table
        const escapedName = table.replace(/"/g, '""');
        const checkQuery = `
          SELECT table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'main' AND table_name = '${escapedName}'
        `;
        const resultReader = await conn.runAndReadAll(checkQuery);
        await resultReader.readAll();
        const rows = resultReader.getRowObjectsJS() as Array<{
          table_type: string;
        }>;

        const tableType =
          rows.length > 0 && rows[0]?.table_type === 'VIEW'
            ? 'view'
            : 'table';

        sheets.push({
          name: table,
          type: tableType,
        });
      } catch {
        // If check fails, default to view
        sheets.push({
          name: table,
          type: 'view',
        });
      } finally {
        DuckDBInstanceManager.returnConnection(conversationId, workspace, conn);
      }
    }
  }

  return {
    sheets,
    count: sheets.length,
  };
};


