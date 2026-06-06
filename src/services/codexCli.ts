import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigurationString } from '../configScope';
import { sanitizeLlmErrorText } from './llm/shared';

export interface CodexCliStatus {
  ready: boolean;
  preview?: string;
  detail?: string;
}

const CODEX_HOME_DIR_NAME = 'codex-home';
const CODEX_FILE_STORE_CONFIG = 'cli_auth_credentials_store = "file"\n';
const CODEX_FILE_STORE_OVERRIDE = 'cli_auth_credentials_store="file"';
const CODEX_AUTH_ENV_VARS = [
  'CODEX_API_KEY',
  'CODEX_ACCESS_TOKEN',
  'OPENAI_API_KEY'
];
const CODEX_ENV_ALLOWLIST = [
  'APPDATA',
  'ComSpec',
  'HOME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'LOCALAPPDATA',
  'NODE_EXTRA_CA_CERTS',
  'Path',
  'PATH',
  'PATHEXT',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'SystemRoot',
  'TEMP',
  'TMP',
  'TMPDIR',
  'USER',
  'USERNAME',
  'USERPROFILE',
  'WINDIR'
];
const SECRET_ENV_PATTERN = /(?:^|_)(?:API[_-]?KEY|AUTH|BEARER|COOKIE|CREDENTIAL|PASSWORD|PRIVATE[_-]?KEY|SECRET|SESSION|TOKEN)(?:_|$)/i;

export function getCodexCommand(config: vscode.WorkspaceConfiguration): string {
  const value = getUserConfigurationString(config, 'codexCommand', 'codex')?.trim();
  return value || 'codex';
}

export function getCodexHomePath(context: vscode.ExtensionContext): string {
  return path.join(context.globalStorageUri.fsPath, CODEX_HOME_DIR_NAME);
}

export async function ensureCodexHome(context: vscode.ExtensionContext): Promise<string> {
  const codexHome = getCodexHomePath(context);
  await fs.promises.mkdir(codexHome, { recursive: true, mode: 0o700 });
  await ensureFileCredentialStore(codexHome);
  return codexHome;
}

export function buildCodexEnvironment(codexHome?: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of CODEX_ENV_ALLOWLIST) {
    const value = process.env[key];
    if (value !== undefined && !isSensitiveEnvKey(key)) {
      env[key] = value;
    }
  }
  if (codexHome) {
    env.CODEX_HOME = codexHome;
    env.CODEX_SQLITE_HOME = codexHome;
  }
  return env;
}

export function buildCodexTerminalEnvironment(codexHome: string): Record<string, string | null> {
  const env: Record<string, string | null> = {};
  for (const key of Object.keys(process.env)) {
    if (isSensitiveEnvKey(key)) {
      env[key] = null;
    }
  }
  for (const key of CODEX_AUTH_ENV_VARS) {
    env[key] = null;
  }
  env.CODEX_HOME = codexHome;
  env.CODEX_SQLITE_HOME = codexHome;
  return env;
}

export function buildCodexLoginCommand(command: string, platform = process.platform): string {
  if (platform === 'win32') {
    return `& ${quotePowerShell(command)} login -c ${quotePowerShell(CODEX_FILE_STORE_OVERRIDE)}`;
  }
  return `${quotePosix(command)} login -c ${quotePosix(CODEX_FILE_STORE_OVERRIDE)}`;
}

export async function inspectCodexCli(
  config: vscode.WorkspaceConfiguration,
  codexHome?: string
): Promise<CodexCliStatus> {
  const command = getCodexCommand(config);
  const env = buildCodexEnvironment(codexHome);
  try {
    const status = await runCodexCommand(command, ['login', '-c', CODEX_FILE_STORE_OVERRIDE, 'status'], 5000, env);
    const combined = `${status.stdout}\n${status.stderr}`.trim();
    if (status.code === 0 && /logged in/i.test(combined)) {
      return { ready: true, preview: getLoginPreview(combined) };
    }
    const version = await runCodexCommand(command, ['--version'], 5000, env);
    if (version.code === 0) {
      return {
        ready: false,
        preview: 'not signed in',
        detail: sanitizeLlmErrorText(combined || 'Codex is installed but not signed in.')
      };
    }
    return {
      ready: false,
      preview: 'not available',
      detail: sanitizeLlmErrorText(version.stderr || version.stdout || 'Codex CLI is not available.')
    };
  } catch (error) {
    return {
      ready: false,
      preview: 'not available',
      detail: sanitizeLlmErrorText(error instanceof Error ? error.message : String(error))
    };
  }
}

export async function logoutCodexCli(
  config: vscode.WorkspaceConfiguration,
  codexHome?: string
): Promise<void> {
  const command = getCodexCommand(config);
  const result = await runCodexCommand(
    command,
    ['logout', '-c', CODEX_FILE_STORE_OVERRIDE],
    15000,
    buildCodexEnvironment(codexHome)
  );
  if (result.code !== 0) {
    const detail = sanitizeLlmErrorText(result.stderr || result.stdout || `exit code ${result.code}`);
    throw new Error(detail);
  }
}

function getLoginPreview(statusText: string): string {
  const match = statusText.match(/logged in using\s+(.+)/i);
  return match?.[1]?.trim() || 'signed in';
}

async function ensureFileCredentialStore(codexHome: string): Promise<void> {
  const configPath = path.join(codexHome, 'config.toml');
  try {
    const current = await fs.promises.readFile(configPath, 'utf8');
    if (/^\s*cli_auth_credentials_store\s*=/m.test(current)) {
      return;
    }
    const next = current.endsWith('\n')
      ? `${current}${CODEX_FILE_STORE_CONFIG}`
      : `${current}\n${CODEX_FILE_STORE_CONFIG}`;
    await fs.promises.writeFile(configPath, next, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    await fs.promises.writeFile(configPath, CODEX_FILE_STORE_CONFIG, { encoding: 'utf8', mode: 0o600 });
  }
}

function runCodexCommand(
  command: string,
  args: string[],
  timeoutMs: number,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
    const stdout: string[] = [];
    const stderr: string[] = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (!child.killed) child.kill();
      finish(() => resolve({ stdout: stdout.join(''), stderr: stderr.join('') || 'Codex status timed out.', code: null }));
    }, timeoutMs);

    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    child.stdout.on('data', chunk => stdout.push(String(chunk)));
    child.stderr.on('data', chunk => stderr.push(String(chunk)));
    child.once('error', error => finish(() => reject(error)));
    child.once('close', code => finish(() => resolve({ stdout: stdout.join(''), stderr: stderr.join(''), code })));
  });
}

function quotePosix(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/g, `''`)}'`;
}

function isSensitiveEnvKey(key: string): boolean {
  return key.startsWith('COMMIT_MAKER_') || key.startsWith('CODEX_') || SECRET_ENV_PATTERN.test(key);
}
