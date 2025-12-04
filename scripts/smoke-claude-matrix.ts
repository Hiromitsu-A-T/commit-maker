import { MODEL_SUGGESTIONS_BY_PROVIDER, ANTHROPIC_API_VERSION } from '../src/constants';

const key =
  process.env.COMMIT_MAKER_CLAUDE_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  process.env.anthropic_api_key;

if (!key) {
  throw new Error('Claude API key not found in env (COMMIT_MAKER_CLAUDE_API_KEY / ANTHROPIC_API_KEY / anthropic_api_key)');
}

const models = MODEL_SUGGESTIONS_BY_PROVIDER.claude;

async function call(model: string): Promise<void> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_API_VERSION
    },
    body: JSON.stringify({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'ping' }]
    })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Claude ${model} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  process.stdout.write('.');
}

async function main(): Promise<void> {
  for (const m of models) {
    await call(m);
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\nClaude matrix OK (${models.length} models)`);
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
