import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { parseUntrackedPaths } from '../commitDiffUtil';
import { getStrings, DEFAULT_LANGUAGE } from '../i18n/strings';

const execFileAsync = promisify(execFile);
const strings = getStrings(DEFAULT_LANGUAGE);
const MAX_UNTRACKED_FILE_BYTES = 256 * 1024;
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
  /** テスト用: 未追跡ファイルの内容を与える (path -> Buffer) */
  mockUntrackedFiles?: Record<string, Buffer>;
}

export async function collectDiff(
  repo: GitRepositoryLike,
  {
    includeUnstaged,
    includeUntracked,
    includeBinary,
    maxCollectedChars,
    logger,
    mockStatusOutput,
    mockUntrackedFiles
  }: DiffCollectOptions
): Promise<string> {
  const parts: string[] = [];
  const collectionLimit = normalizeDiffCollectionLimit(maxCollectedChars);
  const budget: DiffCollectionBudget = {
    remaining: collectionLimit,
    truncated: false
  };

  // 片方の API が失敗しても、その区分だけ CLI で取得して差分を欠落させない。
  const staged = await readRepositoryDiff(repo, 'staged', collectionLimit, logger);
  if (staged.trim()) {
    appendCollectedPart(parts, `${strings.diffSectionStaged}\n${staged.trim()}`, budget, logger);
  }
  if (includeUnstaged && budget.remaining > 0) {
    const unstaged = await readRepositoryDiff(repo, 'unstaged', collectionLimit, logger);
    if (unstaged.trim()) {
      appendCollectedPart(parts, `${strings.diffSectionUnstaged}\n${unstaged.trim()}`, budget, logger);
    }
  }

  // 未追跡ファイルは未ステージの変更と一緒に扱う。
  if (includeUnstaged && includeUntracked && budget.remaining > 0) {
    const untracked = await collectUntrackedFiles(repo, includeBinary, logger, budget, mockStatusOutput, mockUntrackedFiles);
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
  // 引数なしの diffWithHEAD / diffIndexWithHEAD は変更一覧を返す API もある。
  const cached = section === 'staged';
  const legacyMethod = cached ? 'diffIndexWithHEAD' : 'diffWithHEAD';
  const read = repo.diff?.bind(repo, cached) ?? repo[legacyMethod]?.bind(repo);
  if (read) {
    try {
      const result = await read();
      if (typeof result === 'string') return result;
    } catch (error) {
      logger?.appendLine(strings.msgGitDiffFailed.replace('{detail}', String(error)));
    }
  }
  const cwd = repo.rootUri.fsPath;
  try {
    const args = cached ? ['diff', '--cached'] : ['diff'];
    const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: Math.max(DEFAULT_DIFF_COLLECTION_LIMIT_CHARS, collectionLimit) * 4 });
    return stdout;
  } catch (error) {
    logger?.appendLine(strings.msgGitDiffFailed.replace('{detail}', String(error)));
    return '';
  }
}

async function collectUntrackedFiles(
  repo: GitRepositoryLike,
  includeBinary: boolean,
  logger: { appendLine(message: string): void } | undefined,
  budget: DiffCollectionBudget,
  mockStatusOutput?: string,
  mockUntrackedFiles?: Record<string, Buffer>
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
    try {
      let buffer: Buffer;
      if (mockUntrackedFiles && mockUntrackedFiles[relativePath] !== undefined) {
        buffer = mockUntrackedFiles[relativePath];
      } else {
        const stat = await fs.promises.lstat(absolutePath);
        if (stat.isSymbolicLink()) {
          logger?.appendLine(`Skipped untracked symlink: ${relativePath}`);
          continue;
        }
        if (!stat.isFile()) {
          continue;
        }
        if (stat.size > MAX_UNTRACKED_FILE_BYTES) {
          logger?.appendLine(`Skipped large untracked file: ${relativePath}`);
          continue;
        }
        buffer = await fs.promises.readFile(absolutePath);
      }
      const isBinary = isBinaryBuffer(buffer, relativePath);
      if (!includeBinary && isBinary) {
        logger?.appendLine(strings.msgUntrackedSkipBinary.replace('{path}', relativePath));
        continue;
      }
      const content = buffer.toString('utf8');
      appendCollectedPart(
        parts,
        strings.diffSectionUntracked.replace('{path}', relativePath) + '\n' + content.trim(),
        budget,
        logger
      );
    } catch (error) {
      logger?.appendLine(strings.msgUntrackedReadFailed.replace('{path}', relativePath).replace('{detail}', String(error)));
    }
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
    return Math.floor(value);
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
