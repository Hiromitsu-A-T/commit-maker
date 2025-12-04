import { MODEL_SUGGESTIONS_BY_PROVIDER } from '../src/constants';

const key =
  process.env.COMMIT_MAKER_GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.google_api_key;

if (!key) {
  throw new Error('Gemini API key not found in env (COMMIT_MAKER_GEMINI_API_KEY / GOOGLE_API_KEY / google_api_key)');
}

const models = MODEL_SUGGESTIONS_BY_PROVIDER.gemini;

async function call(model: string): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      generationConfig: { maxOutputTokens: 8, temperature: 0 }
    })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini ${model} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  process.stdout.write('.');
}

async function main(): Promise<void> {
  for (const m of models) {
    await call(m);
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\nGemini matrix OK (${models.length} models)`);
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
