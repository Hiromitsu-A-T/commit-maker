import assert from 'assert';
import * as path from 'path';
import {
  buildCodexEnvironment,
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
  process.env.CODEX_API_KEY = 'codex-key';
  process.env.CODEX_ACCESS_TOKEN = 'codex-token';
  process.env.OPENAI_API_KEY = 'openai-key';
  try {
    const env = buildCodexEnvironment('/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_HOME, '/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_SQLITE_HOME, '/tmp/commit-maker-codex');
    assert.strictEqual(env.CODEX_API_KEY, undefined);
    assert.strictEqual(env.CODEX_ACCESS_TOKEN, undefined);
    assert.strictEqual(env.OPENAI_API_KEY, undefined);
  } finally {
    restoreEnv('CODEX_HOME', originalCodexHome);
    restoreEnv('CODEX_API_KEY', originalCodexApiKey);
    restoreEnv('CODEX_ACCESS_TOKEN', originalAccessToken);
    restoreEnv('OPENAI_API_KEY', originalOpenAiApiKey);
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
