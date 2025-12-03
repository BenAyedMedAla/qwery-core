#!/usr/bin/env node
/**
 * Manual test script to demonstrate business context building
 * This simulates what happens when sheets are inserted
 */

import { join } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import {
  analyzeSchemaAndUpdateContext,
  loadBusinessContext,
} from './packages/agent-factory-sdk/src/services/business-context.service.js';

const testDir = join(process.cwd(), 'test-business-context-manual');

// Clean up
try {
  await rm(testDir, { recursive: true, force: true });
} catch {}
await mkdir(testDir, { recursive: true });

console.log('🧪 Testing Business Context Building\n');

// Simulate Sheet 1: Users/Employees
const schema1 = {
  databaseName: 'google_sheet',
  schemaName: 'google_sheet',
  tables: [
    {
      tableName: 'sheet_18wKwHiF',
      columns: [
        { columnName: 'id', columnType: 'BIGINT' },
        { columnName: 'name', columnType: 'VARCHAR' },
        { columnName: 'age', columnType: 'BIGINT' },
        { columnName: 'city', columnType: 'VARCHAR' },
        { columnName: 'email', columnType: 'VARCHAR' },
        { columnName: 'status', columnType: 'VARCHAR' },
      ],
    },
  ],
};

console.log('📊 Inserting Sheet 1: Users/Employees');
const context1 = await analyzeSchemaAndUpdateContext(
  testDir,
  'sheet_18wKwHiF',
  schema1,
);
console.log(`   ✅ Created context with ${context1.entities.size} entities`);
console.log(`   ✅ Domain: ${context1.domain}`);
console.log(`   ✅ Vocabulary entries: ${context1.vocabulary.size}`);
console.log(`   ✅ Relationships: ${context1.relationships.length}\n`);

// Simulate Sheet 2: Departments/Positions
const schema2 = {
  databaseName: 'google_sheet',
  schemaName: 'google_sheet',
  tables: [
    {
      tableName: 'sheet_1b595zjV',
      columns: [
        { columnName: 'user_id', columnType: 'BIGINT' },
        { columnName: 'dept_id', columnType: 'BIGINT' },
        { columnName: 'position', columnType: 'VARCHAR' },
      ],
    },
  ],
};

console.log('📊 Inserting Sheet 2: Departments/Positions');
const context2 = await analyzeSchemaAndUpdateContext(
  testDir,
  'sheet_1b595zjV',
  schema2,
);
console.log(`   ✅ Updated context with ${context2.entities.size} entities`);
console.log(`   ✅ Domain: ${context2.domain}`);
console.log(`   ✅ Vocabulary entries: ${context2.vocabulary.size}`);
console.log(`   ✅ Relationships: ${context2.relationships.length}`);
if (context2.relationships.length > 0) {
  console.log('   🔗 Detected relationships:');
  context2.relationships.forEach((rel) => {
    console.log(
      `      - ${rel.fromView} ↔ ${rel.toView} (via ${rel.joinColumn}, ${rel.type})`,
    );
  });
}
console.log();

// Simulate Sheet 3: Orders/Sales
const schema3 = {
  databaseName: 'google_sheet',
  schemaName: 'google_sheet',
  tables: [
    {
      tableName: 'sheet_1msq_2yV',
      columns: [
        { columnName: 'order_id', columnType: 'BIGINT' },
        { columnName: 'user_id', columnType: 'BIGINT' },
        { columnName: 'product_name', columnType: 'VARCHAR' },
        { columnName: 'amount', columnType: 'DOUBLE' },
        { columnName: 'order_date', columnType: 'DATE' },
      ],
    },
  ],
};

console.log('📊 Inserting Sheet 3: Orders/Sales');
const context3 = await analyzeSchemaAndUpdateContext(
  testDir,
  'sheet_1msq_2yV',
  schema3,
);
console.log(`   ✅ Updated context with ${context3.entities.size} entities`);
console.log(`   ✅ Domain: ${context3.domain}`);
console.log(`   ✅ Vocabulary entries: ${context3.vocabulary.size}`);
console.log(`   ✅ Relationships: ${context3.relationships.length}`);
if (context3.relationships.length > 0) {
  console.log('   🔗 All detected relationships:');
  context3.relationships.forEach((rel) => {
    console.log(
      `      - ${rel.fromView} ↔ ${rel.toView} (via ${rel.joinColumn}, ${rel.type}, confidence: ${rel.confidence})`,
    );
  });
}
console.log();

// Show final business context
console.log('📋 Final Business Context Summary:\n');
console.log('Entities:');
const entitiesArray = Array.from(context3.entities.values()).slice(0, 10);
entitiesArray.forEach((entity) => {
  console.log(
    `   - ${entity.name} (${entity.businessType}): ${entity.columns.join(', ')}`,
  );
  console.log(`     Views: ${entity.views.join(', ')}`);
});

console.log('\nVocabulary (sample):');
const vocabArray = Array.from(context3.vocabulary.entries()).slice(0, 15);
vocabArray.forEach(([tech, business]) => {
  console.log(`   - "${tech}" → "${business}"`);
});

console.log('\nEntity Graph:');
context3.entityGraph.forEach((connections, entity) => {
  if (connections.length > 0) {
    console.log(`   - ${entity} connects to: ${connections.join(', ')}`);
  }
});

console.log('\n✅ Business context successfully built and persisted!');
console.log(`📁 Context saved to: ${join(testDir, 'business-context.json')}\n`);

// Verify persistence
const loaded = await loadBusinessContext(testDir);
if (loaded) {
  console.log('✅ Context persistence verified - can be loaded successfully');
  console.log(`   Loaded ${loaded.views.size} views`);
  console.log(`   Loaded ${loaded.entities.size} entities`);
  console.log(`   Loaded ${loaded.relationships.length} relationships\n`);
}

