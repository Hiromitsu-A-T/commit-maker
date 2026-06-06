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

export interface GitRepositoryLike {
  rootUri: { fsPath: string };
  diffWithHEAD?(uri?: unknown): Promise<string>;
  diffIndexWithHEAD?(uri?: unknown): Promise<string>;
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
  const strings = getStrings(DEFAULT_LANGUAGE);
  const parts: string[] = [];
  const budget: DiffCollectionBudget = {
    remaining: normalizeDiffCollectionLimit(maxCollectedChars),
    truncated: false
  };

  // Prefer VS Code Git API when available
  if (typeof repo.diffIndexWithHEAD === 'function') {
    try {
      const staged = await repo.diffIndexWithHEAD();
      if (staged?.trim()) {
        appendCollectedPart(parts, `${strings.diffSectionStaged}\n${staged.trim()}`, budget, logger);
      }
    } catch (error) {
      logger?.appendLine(strings.msgGitDiffFailed.replace('{detail}', String(error)));
    }
  }
  if (includeUnstaged && typeof repo.diffWithHEAD === 'function') {
    try {
      const working = await repo.diffWithHEAD();
      if (working?.trim()) {
        appendCollectedPart(parts, `${strings.diffSectionUnstaged}\n${working.trim()}`, budget, logger);
      }
    } catch (error) {
      logger?.appendLine(strings.msgGitDiffFailed.replace('{detail}', String(error)));
    }
  }

  // Fall back to git CLI if Git API is unavailable
  if (!parts.length) {
    const repoPath = repo.rootUri.fsPath;
    const staged = await runGitDiff(['diff', '--cached'], repoPath, logger);
    if (staged.trim()) {
      appendCollectedPart(parts, `${strings.diffSectionStaged}\n${staged.trim()}`, budget, logger);
    }
    if (includeUnstaged) {
      const unstaged = await runGitDiff(['diff'], repoPath, logger);
      if (unstaged.trim()) {
        appendCollectedPart(parts, `${strings.diffSectionUnstaged}\n${unstaged.trim()}`, budget, logger);
      }
    }
  }

  // Include untracked files
  if (includeUnstaged && includeUntracked && budget.remaining > 0) {
    const untracked = await collectUntrackedFiles(repo, includeBinary, logger, budget, mockStatusOutput, mockUntrackedFiles);
    if (untracked.trim()) {
      parts.push(untracked.trim());
    }
  }

  return parts.join('\n\n');
}

async function runGitDiff(args: string[], cwd: string, logger?: { appendLine(message: string): void }): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 4 * 1024 * 1024 });
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
  let status = '';
  if (mockStatusOutput !== undefined) {
    status = mockStatusOutput;
  } else {
    try {
      const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
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
  for (const rel of paths) {
    if (budget.remaining <= 0) {
      markDiffTruncated(budget, logger);
      break;
    }
    const abs = resolveInsideRoot(repoPath, rel);
    if (!abs) {
      logger?.appendLine(`Skipped untracked file outside repository: ${rel}`);
      continue;
    }
    if (isSensitiveUntrackedPath(rel)) {
      logger?.appendLine(`Skipped sensitive untracked file: ${rel}`);
      continue;
    }
    try {
      let buf: Buffer;
      if (mockUntrackedFiles && mockUntrackedFiles[rel] !== undefined) {
        buf = mockUntrackedFiles[rel];
      } else {
        const stat = await fs.promises.lstat(abs);
        if (stat.isSymbolicLink()) {
          logger?.appendLine(`Skipped untracked symlink: ${rel}`);
          continue;
        }
        if (!stat.isFile()) {
          continue;
        }
        if (stat.size > MAX_UNTRACKED_FILE_BYTES) {
          logger?.appendLine(`Skipped large untracked file: ${rel}`);
          continue;
        }
        buf = await fs.promises.readFile(abs);
      }
      const isBinary = isBinaryBuffer(buf, rel);
      if (!includeBinary && isBinary) {
        logger?.appendLine(strings.msgUntrackedSkipBinary.replace('{path}', rel));
        continue;
      }
      const content = buf.toString('utf8');
      appendCollectedPart(
        parts,
        strings.diffSectionUntracked.replace('{path}', rel) + '\n' + content.trim(),
        budget,
        logger
      );
    } catch (error) {
      logger?.appendLine(strings.msgUntrackedReadFailed.replace('{path}', rel).replace('{detail}', String(error)));
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

export function isBinaryBuffer(buf: Buffer, filename: string): boolean {
  if (buf.includes(0)) {
    return true;
  }
  const ext = path.extname(filename).toLowerCase();
  const binaryExts = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svgz',
    '.pdf', '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar',
    '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac', '.ogg',
    '.wasm', '.class', '.jar', '.keystore', '.jks', '.p12', '.pem', '.key', '.crt', '.der',
    '.db', '.sqlite', '.sqlite3', '.dex'
  ]);
  return binaryExts.has(ext);
}

function resolveInsideRoot(root: string, rel: string): string | undefined {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, rel);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
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
  return new Set(['.pem', '.key', '.p12', '.pfx', '.jks', '.keystore']).has(ext);
}
