async function main(): Promise<void> {
  const key =
    process.env.COMMIT_MAKER_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.openai_api_key;

  if (!key) {
    throw new Error('OpenAI API key not found in env (COMMIT_MAKER_OPENAI_API_KEY / OPENAI_API_KEY / openai_api_key)');
  }

  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  console.log('OpenAI OK');
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
