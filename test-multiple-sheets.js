#!/usr/bin/env node

/**
 * Test script for multiple Google Sheets functionality
 * Tests the readDataAgent with two Google Sheets
 */

import { readDataAgent } from './packages/agent-factory-sdk/src/agents/actors/read-data-agent.actor.js';

const SHEET1 = 'https://docs.google.com/spreadsheets/d/1yfjcBF4X8waukFdI5u9ctkagFwAn-BRgM5IUCUK1Ay8/edit?gid=0#gid=0';
const SHEET2 = 'https://docs.google.com/spreadsheets/d/1sDa--f0yChIisw8IQA6MEC17jLd5dg4XHBWy1F_J07A/edit?gid=0#gid=0';

const conversationId = `test-${Date.now()}`;

console.log('='.repeat(60));
console.log('Testing Multiple Google Sheets Functionality');
console.log('='.repeat(60));
console.log('');
console.log(`Sheet 1 (Users): ${SHEET1}`);
console.log(`Sheet 2 (Employees): ${SHEET2}`);
console.log('');
console.log('Conversation ID:', conversationId);
console.log('');

const messages = [];

async function ask(question) {
  console.log('\n' + '─'.repeat(60));
  console.log(`❓ Question: ${question}`);
  console.log('─'.repeat(60));
  
  messages.push({
    id: `msg-${Date.now()}`,
    role: 'user',
    parts: [{ type: 'text', text: question }],
  });

  const stream = await readDataAgent(conversationId, messages);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  console.log('\n💬 Agent Response:\n');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      
      // Try to parse SSE format
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text-delta' && data.textDelta) {
              process.stdout.write(data.textDelta);
            } else if (data.type === 'tool-call' && data.toolName) {
              console.log(`\n🔧 Tool: ${data.toolName}`);
            } else if (data.type === 'tool-result' && data.toolName) {
              console.log(`\n✅ Tool Result: ${data.toolName}`);
            }
          } catch (e) {
            // Not JSON, just print
            if (line.trim() && !line.startsWith('data:')) {
              process.stdout.write(line);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n');
  
  messages.push({
    id: `msg-${Date.now()}`,
    role: 'assistant',
    parts: [{ type: 'text', text: fullResponse }],
  });
}

async function runTests() {
  try {
    // Test 1: Insert first sheet
    await ask(`Please create a view from this Google Sheet: ${SHEET1}`);
    
    // Test 2: Insert second sheet
    await ask(`Please create a view from this Google Sheet: ${SHEET2}`);
    
    // Test 3: List all views
    await ask('List all available views');
    
    // Test 4: Get schemas
    await ask('Show me the schema of all views');
    
    // Test 5: Query first sheet
    await ask('Show me the first 5 rows from the users sheet');
    
    // Test 6: Query second sheet
    await ask('Show me the first 5 rows from the employees sheet');
    
    // Test 7: Join query
    await ask('Join the two sheets on user id and show name, age, city, position, and dept_id');
    
    // Test 8: Filtered join
    await ask('Show me all active users with their positions');
    
    // Test 9: Complex query
    await ask('Show me users from Sfax with their department information');
    
    // Test 10: Aggregation
    await ask('Count how many users are in each department');
    
    // Test 11: Aggregation with calculation
    await ask('Show me the average score by department');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();

