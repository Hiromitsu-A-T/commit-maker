import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { collectDiff, isBinaryBuffer } from './diffCollector';
import { getStrings, DEFAULT_LANGUAGE } from '../i18n/strings';

const STR = getStrings(DEFAULT_LANGUAGE);

// Mock repository using VS Code Git API shape
const mockRepo = {
  rootUri: { fsPath: '/tmp/mock' },
  diffIndexWithHEAD: async () => 'staged-diff',
  diffWithHEAD: async () => 'work-diff'
};

async function testCollectDiffIncludesSections() {
  const diff = await collectDiff(mockRepo, {
    includeUnstaged: true,
    includeUntracked: false,
    includeBinary: true
  });
  assert(diff.includes(STR.diffSectionStaged), 'should include staged heading');
  assert(diff.includes(STR.diffSectionUnstaged), 'should include unstaged heading');
  assert(diff.includes('staged-diff'));
  assert(diff.includes('work-diff'));
}

async function testCollectDiffStagedOnly() {
  const diff = await collectDiff(mockRepo, {
    includeUnstaged: false,
    includeUntracked: false,
    includeBinary: true
  });
  assert(diff.includes(STR.diffSectionStaged), 'should include staged when unstaged disabled');
  assert(!diff.includes(STR.diffSectionUnstaged), 'should not include unstaged when disabled');
}

async function testUntrackedSkipWhenDisabledBinary() {
  const repo = { ...mockRepo, rootUri: { fsPath: '/tmp/mock-untracked' } };
  const diff = await collectDiff(repo, {
    includeUnstaged: true,
    includeUntracked: true,
    includeBinary: false,
    mockStatusOutput: '?? untracked/note.txt\n?? untracked/bin.dat\n',
    mockUntrackedFiles: {
      'untracked/note.txt': Buffer.from('hello'),
      'untracked/bin.dat': Buffer.from([0, 1, 2])
    }
  });
  const heading = STR.diffSectionUntracked.replace('{path}', 'untracked/note.txt');
  assert(diff.includes(heading), 'text untracked should be included');
  assert(!diff.includes('bin.dat'), 'binary-suspect should be skipped when includeBinary=false');
}

async function testUntrackedSkipsSensitiveAndLargeFiles() {
  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-diff-security-'));
  try {
    await fs.promises.writeFile(path.join(tmpRoot, '.env'), 'SECRET_TOKEN=should-not-leak');
    const largePath = path.join(tmpRoot, 'large.txt');
    await fs.promises.writeFile(largePath, Buffer.alloc(256 * 1024 + 1, 'x'));
    const repo = { ...mockRepo, rootUri: { fsPath: tmpRoot } };
    const diff = await collectDiff(repo, {
      includeUnstaged: true,
      includeUntracked: true,
      includeBinary: true,
      mockStatusOutput: '?? .env\n?? large.txt\n'
    });
    assert(!diff.includes('should-not-leak'), 'sensitive untracked files should be skipped');
    assert(!diff.includes('large.txt'), 'oversized untracked files should be skipped');
  } finally {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  }
}

async function testUntrackedSkipsPathEscapeAndSymlink() {
  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-diff-root-'));
  const outside = path.join(os.tmpdir(), `commit-maker-outside-${Date.now()}.txt`);
  try {
    await fs.promises.writeFile(outside, 'outside-secret');
    await fs.promises.symlink(outside, path.join(tmpRoot, 'link.txt')).catch(() => undefined);
    const repo = { ...mockRepo, rootUri: { fsPath: tmpRoot } };
    const diff = await collectDiff(repo, {
      includeUnstaged: true,
      includeUntracked: true,
      includeBinary: true,
      mockStatusOutput: '?? ../outside.txt\n?? link.txt\n'
    });
    assert(!diff.includes('outside-secret'), 'paths outside the repository should be skipped');
  } finally {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    await fs.promises.rm(outside, { force: true });
  }
}

async function testBinaryHeuristic() {
  const text = Buffer.from('text only');
  const bin = Buffer.from([0x00, 0x01]);
  assert.strictEqual(isBinaryBuffer(text, 'note.txt'), false);
  assert.strictEqual(isBinaryBuffer(bin, 'note.txt'), true);
  assert.strictEqual(isBinaryBuffer(text, 'image.png'), true, 'png extension should be treated as binary');
}

export async function runDiffCollectorTests() {
  await testCollectDiffIncludesSections();
  await testCollectDiffStagedOnly();
  await testUntrackedSkipWhenDisabledBinary();
  await testUntrackedSkipsSensitiveAndLargeFiles();
  await testUntrackedSkipsPathEscapeAndSymlink();
  await testBinaryHeuristic();
  console.log('diffCollector.test.ts passed');
}
