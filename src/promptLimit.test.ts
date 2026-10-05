import assert from 'assert';
import { applyPromptLimit, buildLocalDiffDigest, getLocalPromptCharLimit } from './promptLimit';

{
  const text = 'a'.repeat(120);
  const limited = applyPromptLimit(text, 'limited', 50);
  assert(limited.includes('chars omitted'), 'omitted marker should appear when truncated');
  assert(limited.length < text.length, 'should shorten the text when over limit');
}

{
  const text = '0123456789';
  assert.strictEqual(applyPromptLimit(text, 'limited', 1), '\n\n[...10 chars omitted...]\n\n');
  assert.strictEqual(applyPromptLimit(text, 'limited', 2), '\n\n[...9 chars omitted...]\n\n9');
  assert.strictEqual(applyPromptLimit(text, 'limited', 6), '0\n\n[...5 chars omitted...]\n\n6789');
  assert.strictEqual(applyPromptLimit(text, 'limited', 0), text);
  assert.strictEqual(applyPromptLimit(text, 'limited', null), text);
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
  assert(getLocalPromptCharLimit(32768, 2048) >= 16000);
  assert.strictEqual(getLocalPromptCharLimit(1_000_000, 2048), 96000);
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

console.log('promptLimit.test.ts passed');
