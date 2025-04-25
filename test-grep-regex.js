import { grepFiles } from './dist/system.js';

async function test() {
  try {
    const results = await grepFiles('\\d+', 'test-grep.txt', {
      useRegex: true,
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
