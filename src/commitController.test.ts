import assert from 'assert';
import { applyPromptLimit, buildLocalDiffDigest, getLocalPromptCharLimit, splitTextIntoChunks } from './promptLimit';

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

{
  const diff = [
    'diff --git a/src/a.ts b/src/a.ts',
    '@@ -1,2 +1,3 @@',
    '-old value',
    '+new value',
    '+another value',
    'diff --git a/src/b.ts b/src/b.ts',
    'new file mode 100644',
    '@@ -0,0 +1,1 @@',
    '+created file'
  ].join('\n');
  const digest = buildLocalDiffDigest(diff, 4000);
  assert(digest.includes('Files changed: 2'), 'digest should count changed files');
  assert(digest.includes('src/a.ts'), 'digest should include first file path');
  assert(digest.includes('src/b.ts'), 'digest should include second file path');
  assert(digest.includes('Stats: +2 -1'), 'digest should include per-file stats');
  assert(digest.includes('new file mode'), 'digest should keep metadata');
}

{
  const digest = buildLocalDiffDigest('### Untracked notes.txt\nhello\nworld', 4000);
  assert(digest.includes('notes.txt'), 'digest should include untracked file path');
  assert(digest.includes('Stats: +2 -0'), 'digest should count untracked lines as additions');
  assert(digest.includes('+ hello'), 'digest should sample untracked content');
}

console.log('commitController.test.ts passed');
