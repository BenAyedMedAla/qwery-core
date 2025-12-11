/**
 * System schema filtering utility
 * Uses extension abstraction to determine system schemas per datasource provider
 */

// Base system schemas by DuckDB foreign type
const BASE_SYSTEM_SCHEMAS: Record<string, string[]> = {
  POSTGRES: [
    'information_schema',
    'pg_catalog',
    'pg_toast',
    'pg_temp',
    'pg_toast_temp',
    'supabase_migrations',
    'vault',
    'storage',
    'realtime',
    'graphql',
    'graphql_public',
    'auth',
    'extensions',
    'pgbouncer',
  ],
  MYSQL: ['information_schema', 'mysql', 'performance_schema', 'sys'],
  SQLITE: ['sqlite_master'],
};

// Provider-specific system schemas (for providers that extend base types)
const PROVIDER_SPECIFIC_SCHEMAS: Record<string, string[]> = {
  // All PostgreSQL variants share the same schemas
  postgresql: [],
  'postgresql-supabase': [],
  'postgresql-neon': [],
  mysql: [],
  sqlite: [],
};

/**
 * Get system schemas for a datasource provider
 * Uses provider registry to determine base type, then applies provider-specific schemas
 */
export async function getSystemSchemas(
  datasourceProvider: string,
): Promise<Set<string>> {
  const provider = datasourceProvider.toLowerCase();

  // Get provider mapping to determine base DuckDB type
  let baseType: string | null = null;
  try {
    const { getProviderMapping } = await import('./provider-registry');
    const mapping = await getProviderMapping(datasourceProvider);
    if (mapping) {
      baseType = mapping.duckdbType;
    }
  } catch {
    // Provider registry not available, fall back to direct lookup
  }

  // Get base schemas from DuckDB type
  const baseSchemas = baseType ? BASE_SYSTEM_SCHEMAS[baseType] || [] : [];

  // Get provider-specific schemas
  const providerSchemas = PROVIDER_SPECIFIC_SCHEMAS[provider] || [];

  // Combine base and provider-specific schemas
  const allSchemas = [...baseSchemas, ...providerSchemas];

  // Try to get from extension metadata if available (for future extensibility)
  try {
    const extensionsSdk = await import('@qwery/extensions-sdk');
    const { getDiscoveredDatasource } = extensionsSdk;

    const extension = await getDiscoveredDatasource(provider);
    if (extension) {
      // Extensions can define system schemas in their metadata
      // For now, we use the base schemas but this can be extended
      // by adding a systemSchemas property to extension metadata
    }
  } catch {
    // Extension not available, use defaults
  }

  return new Set(allSchemas.map((s) => s.toLowerCase()));
}

/**
 * Check if a schema is a system schema for the given provider
 */
export async function isSystemSchema(
  schemaName: string,
  datasourceProvider: string,
): Promise<boolean> {
  const systemSchemas = await getSystemSchemas(datasourceProvider);
  return systemSchemas.has(schemaName.toLowerCase());
}

/**
 * Get all known system schemas (union of all providers)
 * Useful for filtering when provider is unknown
 */
export function getAllSystemSchemas(): Set<string> {
  const allSchemas = new Set<string>();
  for (const schemas of Object.values(BASE_SYSTEM_SCHEMAS)) {
    for (const schema of schemas) {
      allSchemas.add(schema.toLowerCase());
    }
  }
  for (const schemas of Object.values(PROVIDER_SPECIFIC_SCHEMAS)) {
    for (const schema of schemas) {
      allSchemas.add(schema.toLowerCase());
    }
  }
  return allSchemas;
}

/**
 * Check if a table name indicates a system table
 * (regardless of provider)
 */
export function isSystemTableName(tableName: string): boolean {
  const name = tableName.toLowerCase();
  return (
    name.startsWith('pg_') ||
    name.startsWith('sqlite_') ||
    name.startsWith('duckdb_') ||
    name.startsWith('_') ||
    name.includes('_migrations') ||
    name.includes('_secrets')
  );
}
