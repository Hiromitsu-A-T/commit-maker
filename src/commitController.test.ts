import assert from 'assert';
import { applyPromptLimit, getLocalPromptCharLimit, splitTextIntoChunks } from './promptLimit';

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

{
  const limit = getLocalPromptCharLimit(32768, 2048);
  assert(limit > 20000, 'local prompt char limit should allow substantial input');
}

{
  const text = 'b'.repeat(50000);
  const chunks = splitTextIntoChunks(text, getLocalPromptCharLimit(32768, 2048));
  assert(chunks.length > 1, 'large local diffs should be split into chunks');
  assert.strictEqual(chunks.join(''), text, 'chunking should preserve all input text');
}

{
  const text = `diff --git a/a.ts b/a.ts\n${'a'.repeat(1200)}\n\ndiff --git a/b.ts b/b.ts\n${'b'.repeat(1200)}`;
  const chunks = splitTextIntoChunks(text, 1400);
  assert(chunks.length > 1, 'chunking should split near diff boundaries');
  assert.strictEqual(chunks.join(''), text, 'boundary chunking should preserve text');
}

console.log('commitController.test.ts passed');
