import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { parseUntrackedPaths } from '../commitDiffUtil';
import { getStrings, DEFAULT_LANGUAGE } from '../i18n/strings';

const execFileAsync = promisify(execFile);
const strings = getStrings(DEFAULT_LANGUAGE);

export interface GitRepositoryLike {
  rootUri: { fsPath: string };
  diffWithHEAD?(uri?: unknown): Promise<string>;
  diffIndexWithHEAD?(uri?: unknown): Promise<string>;
}

export interface DiffCollectOptions {
  includeUnstaged: boolean;
  includeUntracked: boolean;
  includeBinary: boolean;
  logger?: { appendLine(message: string): void };
  /** テストや差し替え用の mock ステータス文字列（git status --porcelain 相当） */
  mockStatusOutput?: string;
  /** テスト用: 未追跡ファイルの内容を与える (path -> Buffer) */
  mockUntrackedFiles?: Record<string, Buffer>;
}

export async function collectDiff(
  repo: GitRepositoryLike,
  { includeUnstaged, includeUntracked, includeBinary, logger, mockStatusOutput, mockUntrackedFiles }: DiffCollectOptions
): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);
  const parts: string[] = [];

  // Prefer VS Code Git API when available
  if (typeof repo.diffIndexWithHEAD === 'function') {
    try {
      const staged = await repo.diffIndexWithHEAD();
      if (staged?.trim()) {
        parts.push(`${strings.diffSectionStaged}\n${staged.trim()}`);
      }
    } catch (error) {
      logger?.appendLine(strings.msgGitDiffFailed.replace('{detail}', String(error)));
    }
  }
  if (includeUnstaged && typeof repo.diffWithHEAD === 'function') {
    try {
      const working = await repo.diffWithHEAD();
      if (working?.trim()) {
        parts.push(`${strings.diffSectionUnstaged}\n${working.trim()}`);
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
      parts.push(`${strings.diffSectionStaged}\n${staged.trim()}`);
    }
    if (includeUnstaged) {
      const unstaged = await runGitDiff(['diff'], repoPath, logger);
      if (unstaged.trim()) {
        parts.push(`${strings.diffSectionUnstaged}\n${unstaged.trim()}`);
      }
    }
  }

  // Include untracked files
  if (includeUnstaged && includeUntracked) {
    const untracked = await collectUntrackedFiles(repo, includeBinary, logger, mockStatusOutput, mockUntrackedFiles);
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
    const abs = path.join(repoPath, rel);
    try {
      const buf =
        mockUntrackedFiles && mockUntrackedFiles[rel] !== undefined
          ? mockUntrackedFiles[rel]
          : await fs.promises.readFile(abs);
      const isBinary = isBinaryBuffer(buf, rel);
      if (!includeBinary && isBinary) {
        logger?.appendLine(strings.msgUntrackedSkipBinary.replace('{path}', rel));
        continue;
      }
      const content = buf.toString('utf8');
      parts.push(strings.diffSectionUntracked.replace('{path}', rel) + '\n' + content.trim());
    } catch (error) {
      logger?.appendLine(strings.msgUntrackedReadFailed.replace('{path}', rel).replace('{detail}', String(error)));
    }
  }
  return parts.join('\n\n');
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
