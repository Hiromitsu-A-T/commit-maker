import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_PROVIDER_ENDPOINTS } from '../src/constants';
import { callClaude } from '../src/services/llm/claude';
import { callGemini } from '../src/services/llm/gemini';
import { callOpenAi } from '../src/services/llm/openai';

type ProviderResult = {
  provider: string;
  model: string;
  detail: string;
};

function loadLocalEnv(): void {
  const file = path.join(process.cwd(), '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function envFirst(names: string[]): string | undefined {
  return names.map(name => process.env[name]).find(Boolean);
}

async function checkOpenAi(key: string, model: string): Promise<ProviderResult> {
  await callOpenAi({
    prompt: 'Return exactly: ok',
    model,
    apiKey: key,
    endpoint: DEFAULT_PROVIDER_ENDPOINTS.openai,
    reasoning: 'none',
    verbosity: 'low',
    maxOutputTokens: 256,
    timeoutMs: 120000
  });
  return { provider: 'OpenAI', model, detail: 'reasoning=none' };
}

async function checkGemini(key: string, model: string): Promise<ProviderResult> {
  await callGemini({
    prompt: 'Return exactly: ok',
    model,
    apiKey: key,
    endpoint: DEFAULT_PROVIDER_ENDPOINTS.gemini,
    timeoutMs: 120000
  });
  return { provider: 'Gemini', model, detail: 'generateContent' };
}

async function checkClaude(key: string, model: string): Promise<ProviderResult> {
  await callClaude({
    prompt: 'Return exactly: ok',
    model,
    apiKey: key,
    endpoint: DEFAULT_PROVIDER_ENDPOINTS.claude,
    timeoutMs: 120000
  });
  return { provider: 'Claude', model, detail: 'messages' };
}

async function main(): Promise<void> {
  loadLocalEnv();
  const checks: Array<() => Promise<ProviderResult>> = [];
  const openAiKey = envFirst(['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key']);
  const geminiKey = envFirst(['COMMIT_MAKER_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key']);
  const claudeKey = envFirst(['COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'anthropic_api_key']);

  if (openAiKey) {
    for (const model of ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol']) {
      checks.push(() => checkOpenAi(openAiKey, model));
    }
  } else {
    console.error('SKIP OpenAI: API key not found in env or .env');
  }
  if (geminiKey) {
    checks.push(() => checkGemini(geminiKey, 'gemini-3.5-flash-lite'));
    checks.push(() => checkGemini(geminiKey, 'gemini-3.6-flash'));
  } else {
    console.error('SKIP Gemini: API key not found in env or .env');
  }
  if (claudeKey) {
    checks.push(() => checkClaude(claudeKey, 'claude-haiku-4-5'));
    checks.push(() => checkClaude(claudeKey, 'claude-sonnet-5'));
    checks.push(() => checkClaude(claudeKey, 'claude-fable-5'));
  } else {
    console.error('SKIP Claude: API key not found in env or .env');
  }
  if (checks.length === 0) {
    throw new Error('No cloud API keys found. Set env vars or a local .env file and rerun npm run smoke:cloud:minimal');
  }

  const failures: string[] = [];
  for (const check of checks) {
    try {
      const result = await check();
      console.log(`OK ${result.provider} ${result.model} (${result.detail})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error(`FAIL ${message}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`${failures.length} cloud smoke check(s) failed`);
  }
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
