import { parseVoiceCommand } from './voiceCommandParser.js';

interface TestCase {
  input: string;
  expected: any;
}

const testCases: TestCase[] = [
  // Whitelist exact commands
  { input: 'open chrome', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' } },
  { input: 'open notepad', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'notepad' } },
  { input: 'open file explorer', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'explorer' } },
  { input: 'click', expected: { type: 'voice_command', action: 'MOUSE_CLICK', button: 'left' } },
  { input: 'right click', expected: { type: 'voice_command', action: 'MOUSE_CLICK', button: 'right' } },
  { input: 'double click', expected: { type: 'voice_command', action: 'MOUSE_DOUBLE_CLICK' } },
  { input: 'scroll up', expected: { type: 'voice_command', action: 'SCROLL', direction: 'up' } },
  { input: 'scroll down', expected: { type: 'voice_command', action: 'SCROLL', direction: 'down' } },
  { input: 'move mouse left', expected: { type: 'voice_command', action: 'MOVE_MOUSE', direction: 'left', amount: 100 } },
  { input: 'move mouse right', expected: { type: 'voice_command', action: 'MOVE_MOUSE', direction: 'right', amount: 100 } },
  { input: 'press enter', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'ENTER' } },
  { input: 'press escape', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'ESCAPE' } },
  { input: 'press space', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'SPACE' } },
  { input: 'next slide', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'ARROWRIGHT' } },
  { input: 'previous slide', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'ARROWLEFT' } },
  { input: 'close window', expected: { type: 'voice_command', action: 'KEY_COMBINATION', keys: ['ALT', 'F4'] } },

  // Capitalization differences
  { input: 'Open Chrome', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' } },
  { input: 'OPEN CHROME', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' } },
  { input: 'CLicK', expected: { type: 'voice_command', action: 'MOUSE_CLICK', button: 'left' } },
  { input: 'Press Enter', expected: { type: 'voice_command', action: 'KEY_PRESS', key: 'ENTER' } },

  // Extra spaces
  { input: '  open   chrome  ', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' } },
  { input: 'click ', expected: { type: 'voice_command', action: 'MOUSE_CLICK', button: 'left' } },
  { input: '  double   click  ', expected: { type: 'voice_command', action: 'MOUSE_DOUBLE_CLICK' } },

  // Speech variations
  { input: 'launch chrome browser', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' } },
  { input: 'please start notepad', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'notepad' } },
  { input: 'run explorer', expected: { type: 'voice_command', action: 'OPEN_APP', target: 'explorer' } },

  // Unrecognized input
  { input: 'launch code editor', expected: null },
  { input: 'hello computer', expected: null }
];

let failed = false;

console.log('Running Voice Command Parser tests...\n');

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const result = parseVoiceCommand(tc.input);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(tc.expected);

  if (resultStr !== expectedStr) {
    console.error(`❌ Test #${i + 1} FAILED!`);
    console.error(`   Input:    "${tc.input}"`);
    console.error(`   Expected: ${expectedStr}`);
    console.error(`   Got:      ${resultStr}\n`);
    failed = true;
  } else {
    console.log(`✅ Test #${i + 1} PASSED ("${tc.input}")`);
  }
}

if (failed) {
  console.log('\n❌ Verification failed. Some tests did not pass.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed successfully!');
  process.exit(0);
}
