import * as fs from 'fs';
import * as path from 'path';

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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkOpenAi(
  key: string,
  model: string,
  reasoning: 'none' | 'xhigh'
): Promise<ProviderResult> {
  const body: Record<string, unknown> = {
    model,
    input: 'Return exactly: ok',
    max_output_tokens: reasoning === 'xhigh' ? 64 : 16,
    reasoning: { effort: reasoning },
    text: { format: { type: 'text' }, verbosity: 'low' }
  };
  if (reasoning === 'none') {
    body.temperature = 0;
  }
  const res = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI ${model} reasoning=${reasoning} HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return { provider: 'OpenAI', model, detail: `reasoning=${reasoning}` };
}

async function checkGemini(key: string, model: string, maxOutputTokens = 8): Promise<ProviderResult> {
  let lastText = '';
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Return exactly: ok' }] }],
        generationConfig: { maxOutputTokens, temperature: 0 }
      })
    });
    const text = await res.text();
    if (res.ok) {
      return { provider: 'Gemini', model, detail: `maxOutputTokens=${maxOutputTokens}` };
    }
    lastText = text;
    lastStatus = res.status;
    if (res.status !== 503 || attempt === 3) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 5000));
  }
  throw new Error(`Gemini ${model} HTTP ${lastStatus}: ${lastText.slice(0, 300)}`);
}

async function checkClaude(key: string, model: string): Promise<ProviderResult> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: 8,
    messages: [{ role: 'user', content: 'Return exactly: ok' }]
  };
  if (!model.startsWith('claude-opus-4-8')) {
    body.temperature = 0;
  }
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Claude ${model} HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return { provider: 'Claude', model, detail: 'max_tokens=8' };
}

async function main(): Promise<void> {
  loadLocalEnv();
  const checks: Array<Promise<ProviderResult>> = [];
  const openAiKey = envFirst(['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key']);
  const geminiKey = envFirst(['COMMIT_MAKER_GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key']);
  const claudeKey = envFirst(['COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'anthropic_api_key']);

  if (openAiKey) {
    for (const model of ['gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4', 'gpt-5.5']) {
      checks.push(checkOpenAi(openAiKey, model, 'none'));
      checks.push(checkOpenAi(openAiKey, model, 'xhigh'));
    }
  } else {
    console.error('SKIP OpenAI: API key not found in env or .env');
  }
  if (geminiKey) {
    checks.push(checkGemini(geminiKey, 'gemini-2.5-flash-lite'));
    checks.push(checkGemini(geminiKey, 'gemini-3.1-flash-lite'));
    checks.push(checkGemini(geminiKey, 'gemini-3.5-flash', 64));
    checks.push(checkGemini(geminiKey, 'gemini-3-flash-preview', 64));
  } else {
    console.error('SKIP Gemini: API key not found in env or .env');
  }
  if (claudeKey) {
    checks.push(checkClaude(claudeKey, 'claude-haiku-4-5'));
    checks.push(checkClaude(claudeKey, 'claude-sonnet-4-6'));
    checks.push(checkClaude(claudeKey, 'claude-opus-4-8'));
  } else {
    console.error('SKIP Claude: API key not found in env or .env');
  }
  if (checks.length === 0) {
    throw new Error('No cloud API keys found. Set env vars or a local .env file and rerun npm run smoke:cloud:minimal');
  }

  const results = await Promise.all(checks);
  for (const result of results) {
    console.log(`OK ${result.provider} ${result.model} (${result.detail})`);
  }
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
