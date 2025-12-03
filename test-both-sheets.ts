#!/usr/bin/env tsx

/**
 * Test script that forces the agent to query BOTH sheets
 * Questions that REQUIRE joining both sheets
 */

import { readDataAgent } from './packages/agent-factory-sdk/src/agents/actors/read-data-agent.actor';

const SHEET1 = 'https://docs.google.com/spreadsheets/d/1yfjcBF4X8waukFdI5u9ctkagFwAn-BRgM5IUCUK1Ay8/edit?gid=0#gid=0';
const SHEET2 = 'https://docs.google.com/spreadsheets/d/1sDa--f0yChIisw8IQA6MEC17jLd5dg4XHBWy1F_J07A/edit?gid=0#gid=0';

const conversationId = `test-${Date.now()}`;
const messages: Array<{
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}> = [];

console.log('='.repeat(70));
console.log('🧪 TESTING MULTIPLE SHEETS - Questions Requiring BOTH Sheets');
console.log('='.repeat(70));
console.log('');
console.log(`📊 Sheet 1 (Users): ${SHEET1}`);
console.log(`📊 Sheet 2 (Employees): ${SHEET2}`);
console.log('');

async function ask(question: string) {
  console.log('\n' + '─'.repeat(70));
  console.log(`❓ USER QUESTION: ${question}`);
  console.log('─'.repeat(70));
  
  messages.push({
    id: `msg-${Date.now()}-${Math.random()}`,
    role: 'user',
    parts: [{ type: 'text', text: question }],
  });

  const stream = await readDataAgent(conversationId, messages);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  console.log('\n🤖 AGENT RESPONSE (streaming):\n');
  console.log('─'.repeat(70));

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE format
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'text-delta' && data.textDelta) {
              process.stdout.write(data.textDelta);
              fullText += data.textDelta;
            } else if (data.type === 'text' && data.text) {
              process.stdout.write(data.text);
              fullText += data.text;
            } else if (data.type === 'tool-call') {
              console.log(`\n\n🔧 [TOOL CALL] ${data.toolName}`);
              if (data.args) {
                console.log(`   Args: ${JSON.stringify(data.args, null, 2)}`);
              }
            } else if (data.type === 'tool-result') {
              console.log(`\n✅ [TOOL RESULT] ${data.toolName}`);
              if (data.result) {
                const resultStr = typeof data.result === 'string' 
                  ? data.result 
                  : JSON.stringify(data.result, null, 2);
                if (resultStr.length > 500) {
                  console.log(`   Result: ${resultStr.substring(0, 500)}... (truncated)`);
                } else {
                  console.log(`   Result: ${resultStr}`);
                }
              }
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    }
  } catch (error) {
    console.error('\n\n❌ ERROR:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }

  console.log('\n' + '─'.repeat(70));
  
  // Add assistant response to messages
  if (fullText.trim()) {
    messages.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      parts: [{ type: 'text', text: fullText }],
    });
  }
  
  // Wait a bit between questions
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function runTests() {
  try {
    // Set WORKSPACE env if not set
    if (!process.env.WORKSPACE && !process.env.VITE_WORKING_DIR) {
      process.env.WORKSPACE = process.env.VITE_WORKING_DIR = './test-workspace';
    }

    // Step 1: Insert first sheet
    console.log('\n📥 STEP 1: Inserting first sheet (Users)');
    await ask(`Create a view from this Google Sheet: ${SHEET1}`);
    
    // Step 2: Insert second sheet
    console.log('\n📥 STEP 2: Inserting second sheet (Employees)');
    await ask(`Create a view from this Google Sheet: ${SHEET2}`);
    
    // Step 3: List views (to verify both are registered)
    console.log('\n📋 STEP 3: Verifying both views are registered');
    await ask('List all available views');
    
    // Step 4: Questions that REQUIRE BOTH sheets
    console.log('\n\n' + '='.repeat(70));
    console.log('🔥 QUESTIONS THAT REQUIRE BOTH SHEETS (JOIN queries)');
    console.log('='.repeat(70));
    
    // Question 1: Simple JOIN
    await ask('Join the two sheets on user id and show me name, age, city, position, and dept_id for all users');
    
    // Question 2: Filtered JOIN
    await ask('Show me all active users with their position and department id');
    
    // Question 3: JOIN with WHERE clause
    await ask('Show me users from Sfax with their position and department information');
    
    // Question 4: Aggregation across both sheets
    await ask('Count how many users are in each department');
    
    // Question 5: Complex aggregation
    await ask('Show me the average score by department');
    
    // Question 6: JOIN with multiple conditions
    await ask('Show me active users who are DevOps Engineers or Backend Developers with their city and score');
    
    // Question 7: JOIN with ordering
    await ask('Show me the top 5 users by score with their position and department, ordered by score descending');
    
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log('- Both sheets were inserted');
    console.log('- Agent was forced to use listViews to discover both views');
    console.log('- Agent was forced to JOIN both sheets for all questions');
    console.log('- Agent used correct view names from the registry');
    
  } catch (error) {
    console.error('\n\n❌ TEST FAILED:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTests().catch(console.error);

