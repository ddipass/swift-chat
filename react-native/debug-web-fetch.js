/**
 * Debug script to check web_fetch configuration
 * Run: node debug-web-fetch.js
 */

const MMKV = require('react-native-mmkv');

// Initialize storage
const storage = new MMKV.MMKV();

console.log('\n=== Web Fetch Configuration Debug ===\n');

// Check Content Processing Mode
const mode = storage.getString('contentProcessingMode');
console.log('1. Content Processing Mode:', mode || 'NOT SET (default: regex)');

// Check AI Summary Prompt
const prompt = storage.getString('aiSummaryPrompt');
console.log(
  '2. AI Summary Prompt:',
  prompt ? prompt.substring(0, 100) + '...' : 'NOT SET (using default)'
);

// Check Summary Model
const summaryModelStr = storage.getString('summaryModel');
if (summaryModelStr) {
  try {
    const summaryModel = JSON.parse(summaryModelStr);
    console.log(
      '3. Summary Model:',
      summaryModel.modelName,
      '(' + summaryModel.modelId + ')'
    );
  } catch (e) {
    console.log('3. Summary Model: PARSE ERROR');
  }
} else {
  console.log('3. Summary Model: NOT SET (will use chat model)');
}

// Check Text Model (Chat Model)
const textModelStr = storage.getString('textModel');
if (textModelStr) {
  try {
    const textModel = JSON.parse(textModelStr);
    console.log(
      '4. Chat Model:',
      textModel.modelName,
      '(' + textModel.modelId + ')'
    );
  } catch (e) {
    console.log('4. Chat Model: PARSE ERROR');
  }
} else {
  console.log('4. Chat Model: NOT SET');
}

// Check if models are the same
if (summaryModelStr && textModelStr) {
  try {
    const summaryModel = JSON.parse(summaryModelStr);
    const textModel = JSON.parse(textModelStr);
    const same = summaryModel.modelId === textModel.modelId;
    console.log(
      '5. Models are same?',
      same ? 'YES (no switch needed)' : 'NO (will switch)'
    );
  } catch (e) {
    console.log('5. Models comparison: ERROR');
  }
}

console.log('\n=== Diagnosis ===\n');

if (mode !== 'ai_summary') {
  console.log('❌ Problem: Mode is not set to "ai_summary"');
  console.log(
    '   Solution: Go to WebFetch Settings and select "AI Summary" mode'
  );
} else {
  console.log('✅ Mode is correctly set to "ai_summary"');
}

if (!summaryModelStr && !textModelStr) {
  console.log('❌ Problem: No models configured at all');
  console.log('   Solution: Configure your Bedrock/Chat model first');
} else if (!summaryModelStr) {
  console.log('⚠️  Warning: Summary Model not set, will use Chat Model');
  console.log('   This is OK if your Chat Model is configured');
} else {
  console.log('✅ Summary Model is configured');
}

console.log('\n');
