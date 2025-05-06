import { grepFiles } from '../dist/system.js';

async function test() {
  try {
    const results = await grepFiles('grep', 'test-grep.txt', {
      useRegex: false,
      caseSensitive: false,
      beforeContext: 1,
      afterContext: 1
    });
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
