import assert from 'assert';
import { applyPromptLimit } from './promptLimit';

// applyPromptLimit tests
{
  const text = 'a'.repeat(120);
  const limited = applyPromptLimit(text, 'limited', 50);
  assert(limited.includes('chars omitted'), 'omitted marker should appear when truncated');
  assert(limited.length < text.length, 'should shorten the text when over limit');
}

{
  const text = 'hello world';
  const same = applyPromptLimit(text, 'unlimited', null);
  assert.strictEqual(same, text, 'unlimited mode should not trim');
}

console.log('commitController.test.ts passed');
