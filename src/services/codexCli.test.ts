import assert from 'assert';
import * as path from 'path';
import {
  buildCodexEnvironment,
  buildCodexTerminalEnvironment,
  buildCodexLoginCommand,
  getCodexCommand,
  getCodexHomePath
} from './codexCli';

function createConfig(values: Record<string, any>) {
  return {
    inspect: (key: string) => values[key]
  } as any;
}

export async function runCodexCliTests(): Promise<void> {
  assert.strictEqual(getCodexCommand(createConfig({})), 'codex');
  assert.strictEqual(
    getCodexCommand(createConfig({
      codexCommand: {
        defaultValue: 'codex',
        workspaceValue: '/tmp/attacker-codex'
      }
    })),
    'codex'
  );
  assert.strictEqual(
    getCodexCommand(createConfig({
      codexCommand: {
        defaultValue: 'codex',
        globalValue: '/opt/homebrew/bin/codex'
      }
    })),
    '/opt/homebrew/bin/codex'
  );
  const originalCodexHome = process.env.CODEX_HOME;
  const originalCodexApiKey = process.env.CODEX_API_KEY;
  const originalAccessToken = process.env.CODEX_ACCESS_TOKEN;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalCommitMakerKey = process.env.COMMIT_MAKER_GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalGithubToken = process.env.GITHUB_TOKEN;
  const originalPath = process.env.PATH;
  process.env.CODEX_API_KEY = 'codex-key';
  process.env.CODEX_ACCESS_TOKEN = 'codex-token';
  process.env.OPENAI_API_KEY = 'openai-key';
  process.env.COMMIT_MAKER_GEMINI_API_KEY = 'gemini-key';
  process.env.ANTHROPIC_API_KEY = 'anthropic-key';
  process.env.GITHUB_TOKEN = 'github-token';
  process.env.PATH = '/usr/local/bin:/usr/bin';
  try {
    const env = buildCodexEnvironment('/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_HOME, '/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_SQLITE_HOME, '/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_API_KEY, undefined);
    assert.strictEqual(env.CODEX_ACCESS_TOKEN, undefined);
    assert.strictEqual(env.OPENAI_API_KEY, undefined);
    assert.strictEqual(env.COMMIT_MAKER_GEMINI_API_KEY, undefined);
    assert.strictEqual(env.ANTHROPIC_API_KEY, undefined);
    assert.strictEqual(env.GITHUB_TOKEN, undefined);
    assert.strictEqual(env.PATH, '/usr/local/bin:/usr/bin');

    const terminalEnv = buildCodexTerminalEnvironment('/tmp/commit-maker-codex');
    assert.strictEqual(terminalEnv.CODEX_HOME, '/tmp/commit-maker-codex');
    assert.strictEqual(terminalEnv.OPENAI_API_KEY, null);
    assert.strictEqual(terminalEnv.COMMIT_MAKER_GEMINI_API_KEY, null);
    assert.strictEqual(terminalEnv.ANTHROPIC_API_KEY, null);
    assert.strictEqual(terminalEnv.GITHUB_TOKEN, null);
  } finally {
    restoreEnv('CODEX_HOME', originalCodexHome);
    restoreEnv('CODEX_API_KEY', originalCodexApiKey);
    restoreEnv('CODEX_ACCESS_TOKEN', originalAccessToken);
    restoreEnv('OPENAI_API_KEY', originalOpenAiApiKey);
    restoreEnv('COMMIT_MAKER_GEMINI_API_KEY', originalCommitMakerKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
    restoreEnv('GITHUB_TOKEN', originalGithubToken);
    restoreEnv('PATH', originalPath);
  }
  assert.strictEqual(
    getCodexHomePath({ globalStorageUri: { fsPath: '/tmp/commit-maker-storage' } } as any),
    path.join('/tmp/commit-maker-storage', 'codex-home')
  );
  assert.strictEqual(
    buildCodexLoginCommand('codex', 'darwin'),
    "'codex' login -c 'cli_auth_credentials_store=\"file\"'"
  );
  assert.strictEqual(
    buildCodexLoginCommand('codex', 'win32'),
    "& 'codex' login -c 'cli_auth_credentials_store=\"file\"'"
  );
  console.log('codexCli.test.ts passed');
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
