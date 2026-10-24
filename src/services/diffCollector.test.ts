import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { collectDiff, isBinaryBuffer, isSensitiveUntrackedPath } from './diffCollector';

export async function runDiffCollectorTests(): Promise<void> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-diff-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  try {
    git('init', '--quiet');
    fs.writeFileSync(path.join(root, 'staged.txt'), 'staged fixture\n');
    git('add', 'staged.txt');
    fs.appendFileSync(path.join(root, 'staged.txt'), 'working fixture\n');
    fs.mkdirSync(path.join(root, 'nested'));
    fs.writeFileSync(path.join(root, 'nested', 'new.txt'), 'private-untracked-content');
    fs.writeFileSync(path.join(root, 'secrets.json'), 'private-secret');
    const repo = { rootUri: { fsPath: root }, diff: async () => { throw new Error('全量Git APIを呼ばない'); } };
    const options = { includeUnstaged: true, includeUntracked: true, includeBinary: false };
    const all = await collectDiff(repo, options);
    assert.match(all, /staged fixture/);
    assert.match(all, /working fixture/);
    assert.match(all, /nested\/new.txt/);
    assert.ok(!all.includes('private-untracked-content'));
    assert.ok(!all.includes('secrets.json'));
    const staged = await collectDiff(repo, { ...options, includeUnstaged: false });
    assert.ok(!staged.includes('working fixture') && !staged.includes('nested/new.txt'));
    fs.writeFileSync(path.join(root, 'huge.txt'), 'A'.repeat(2 * 1024 * 1024));
    git('add', 'huge.txt');
    const logs: string[] = [];
    const limited = await collectDiff(repo, { ...options, maxCollectedChars: 64000, logger: { appendLine: s => logs.push(s) } });
    assert.match(limited, /omitted by Commit Maker safety limit/);
    assert.ok(limited.length < 65000);
    assert.ok(logs.some(s => s.includes('safety limit')));
    const unlimited = await collectDiff(repo, options);
    assert.ok(unlimited.length > 2 * 1024 * 1024);
    const escaped = await collectDiff(repo, { ...options, mockStatusOutput: '?? ../escape.txt\n?? .aws/credentials\n?? nested/link.txt\n' });
    assert.ok(!escaped.includes('escape.txt') && !escaped.includes('.aws/credentials'));
    assert.ok(!escaped.includes('private-untracked-content'));
    for (const secret of ['.env.local', '.git-credentials', '.docker/config.json', '.kube/config', 'secrets.json', 'prod.tfvars', 'id_ed25519']) {
      assert.ok(isSensitiveUntrackedPath(secret), secret);
    }
    assert.ok(!isBinaryBuffer(Buffer.from('text'), 'note.txt'));
    assert.ok(isBinaryBuffer(Buffer.from([0, 1]), 'note.txt'));
    assert.ok(isBinaryBuffer(Buffer.from('text'), 'image.png'));
    console.log('diffCollector.test.ts passed');
  } finally { await fs.promises.rm(root, { recursive: true, force: true }); }
}
