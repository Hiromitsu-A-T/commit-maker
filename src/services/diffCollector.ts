import * as path from 'path';
import { promisify } from 'util';
import { execFile, spawn } from 'child_process';
import { parseUntrackedPaths } from '../commitDiffUtil';
import { getStrings, DEFAULT_LANGUAGE } from '../i18n/strings';

const execFileAsync = promisify(execFile);
const strings = getStrings(DEFAULT_LANGUAGE);
export const DEFAULT_DIFF_COLLECTION_LIMIT_CHARS = 32 * 1024 * 1024;

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svgz',
  '.pdf', '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar',
  '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac', '.ogg',
  '.wasm', '.class', '.jar', '.keystore', '.jks', '.p12', '.pem', '.key', '.crt', '.der',
  '.db', '.sqlite', '.sqlite3', '.dex'
]);
const SENSITIVE_UNTRACKED_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.jks', '.keystore']);

export interface GitRepositoryLike {
  rootUri: { fsPath: string };
  diff?(cached?: boolean): Promise<string>;
  diffWithHEAD?(uri?: unknown): Promise<unknown>;
  diffIndexWithHEAD?(uri?: unknown): Promise<unknown>;
}

export interface DiffCollectOptions {
  includeUnstaged: boolean;
  includeUntracked: boolean;
  includeBinary: boolean;
  maxCollectedChars?: number;
  logger?: { appendLine(message: string): void };
  /** テストや差し替え用の mock ステータス文字列（git status --porcelain 相当） */
  mockStatusOutput?: string;

}

export async function collectDiff(
  repo: GitRepositoryLike,
  {
    includeUnstaged,
    includeUntracked,
    includeBinary,
    maxCollectedChars,
    logger,
    mockStatusOutput
  }: DiffCollectOptions
): Promise<string> {
  const parts: string[] = [];
  const collectionLimit = normalizeDiffCollectionLimit(maxCollectedChars);
  const budget: DiffCollectionBudget = {
    remaining: collectionLimit,
    truncated: false
  };

  // Git API は本文の全量確保を避けられないため、上限付きの Git stream で取得する。
  const staged = await readRepositoryDiff(repo, 'staged', collectionLimit, logger);
  if (staged.trim()) {
    appendCollectedPart(parts, `${strings.diffSectionStaged}\n${staged.trim()}`, budget, logger);
  }
  if (includeUnstaged && budget.remaining > 0) {
    const unstaged = await readRepositoryDiff(repo, 'unstaged', budget.remaining, logger);
    if (unstaged.trim()) {
      appendCollectedPart(parts, `${strings.diffSectionUnstaged}\n${unstaged.trim()}`, budget, logger);
    }
  }

  // 未追跡ファイルは未ステージの変更と一緒に扱う。
  if (includeUnstaged && includeUntracked && budget.remaining > 0) {
    const untracked = await collectUntrackedFiles(repo, includeBinary, logger, budget, mockStatusOutput);
    if (untracked.trim()) {
      parts.push(untracked.trim());
    }
  }

  return parts.join('\n\n');
}

async function readRepositoryDiff(
  repo: GitRepositoryLike,
  section: 'staged' | 'unstaged',
  collectionLimit: number,
  logger?: { appendLine(message: string): void }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['--no-pager', 'diff', '--no-ext-diff', '--no-textconv'];
    if (section === 'staged') args.push('--cached');
    const child = spawn('git', args, { cwd: repo.rootUri.fsPath, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    let bytes = 0;
    let truncated = false;
    let errorText = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Git diff timed out.')); }, 30000);
    child.stdout.on('data', (chunk: Buffer) => {
      if (truncated) return;
      const remaining = collectionLimit - bytes;
      chunks.push(chunk.subarray(0, remaining));
      bytes += Math.min(chunk.length, remaining);
      if (chunk.length > remaining) {
        truncated = true;
        child.kill();
      }
    });
    child.stderr.on('data', chunk => { errorText = (errorText + String(chunk)).slice(-8192); });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', code => {
      clearTimeout(timer);
      if (code !== 0 && !truncated) { reject(new Error(`Git diff failed: ${errorText}`)); return; }
      let text = Buffer.concat(chunks, bytes).toString('utf8');
      if (truncated) {
        text += '\n[...omitted by Commit Maker safety limit...]';
        logger?.appendLine('Commit Maker diff safety limit reached while reading Git.');
      }
      resolve(text);
    });
  });
}

async function collectUntrackedFiles(
  repo: GitRepositoryLike,
  includeBinary: boolean,
  logger: { appendLine(message: string): void } | undefined,
  budget: DiffCollectionBudget,
  mockStatusOutput?: string
): Promise<string> {
  const repoPath = repo.rootUri.fsPath;
  let status: string;
  if (mockStatusOutput !== undefined) {
    status = mockStatusOutput;
  } else {
    try {
      const { stdout } = await execFileAsync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
        cwd: repoPath,
        maxBuffer: 4 * 1024 * 1024
      });
      status = stdout;
    } catch (error) {
      logger?.appendLine(strings.msgGitStatusFailed.replace('{detail}', String(error)));
      return '';
    }
  }
  const paths = parseUntrackedPaths(status);
  if (!paths.length) {
    return '';
  }
  const parts: string[] = [];
  for (const relativePath of paths) {
    if (budget.remaining <= 0) {
      markDiffTruncated(budget, logger);
      break;
    }
    const absolutePath = resolveInsideRoot(repoPath, relativePath);
    if (!absolutePath) {
      logger?.appendLine(`Skipped untracked file outside repository: ${relativePath}`);
      continue;
    }
    if (isSensitiveUntrackedPath(relativePath)) {
      logger?.appendLine(`Skipped sensitive untracked file: ${relativePath}`);
      continue;
    }
    // 未追跡のパスを再openしない。本文は利用者がステージした後の Git 差分だけで扱う。
    if (!includeBinary && BINARY_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) continue;
    appendCollectedPart(parts, strings.diffSectionUntracked.replace('{path}', relativePath) +
      '\n[Filename only. Stage this file to include its contents.]', budget, logger);
  }
  return parts.join('\n\n');
}

interface DiffCollectionBudget {
  remaining: number;
  truncated: boolean;
}

function appendCollectedPart(
  parts: string[],
  part: string,
  budget: DiffCollectionBudget,
  logger?: { appendLine(message: string): void }
): void {
  if (!part) {
    return;
  }
  if (budget.remaining <= 0) {
    markDiffTruncated(budget, logger);
    return;
  }
  if (part.length <= budget.remaining) {
    parts.push(part);
    budget.remaining -= part.length;
    return;
  }
  const omitted = part.length - budget.remaining;
  const marker = `\n\n[...${omitted} chars omitted by Commit Maker safety limit...]`;
  parts.push(part.slice(0, budget.remaining) + marker);
  budget.remaining = 0;
  markDiffTruncated(budget, logger);
}

function markDiffTruncated(budget: DiffCollectionBudget, logger?: { appendLine(message: string): void }): void {
  if (budget.truncated) return;
  budget.truncated = true;
  logger?.appendLine('Commit Maker diff safety limit reached; remaining diff content was omitted.');
}

function normalizeDiffCollectionLimit(value: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.min(DEFAULT_DIFF_COLLECTION_LIMIT_CHARS, Math.floor(value));
  }
  return DEFAULT_DIFF_COLLECTION_LIMIT_CHARS;
}

export function isBinaryBuffer(buffer: Buffer, filename: string): boolean {
  if (buffer.includes(0)) {
    return true;
  }
  const ext = path.extname(filename).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function resolveInsideRoot(root: string, relativePath: string): string | undefined {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    return undefined;
  }
  return resolved;
}

export function isSensitiveUntrackedPath(filename: string): boolean {
  const lower = filename.toLowerCase();
  const base = path.basename(lower);
  const ext = path.extname(lower);
  if (base === '.env' || base.startsWith('.env.')) {
    return true;
  }
  if (lower.split(/[\\/]/).some(part => ['.aws', '.ssh', '.docker', '.kube', '.azure', '.config', '.gnupg'].includes(part))) return true;
  if (base === 'credentials' || base === '.git-credentials' || /^secrets?(?:\.|$)/.test(base) || ext === '.tfvars' || lower.endsWith('.tfvars.json')) return true;
  if (base === '.npmrc' || base === '.pypirc' || base === '.netrc') {
    return true;
  }
  if (base === 'credentials.json' || base === 'service-account.json' || base.includes('service-account')) {
    return true;
  }
  if (base === 'id_rsa' || base === 'id_dsa' || base === 'id_ecdsa' || base === 'id_ed25519') {
    return true;
  }
  return SENSITIVE_UNTRACKED_EXTENSIONS.has(ext);
}
