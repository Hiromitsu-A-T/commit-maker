async function main(): Promise<void> {
  const key =
    process.env.COMMIT_MAKER_CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.anthropic_api_key;

  if (!key) {
    throw new Error('Claude API key not found in env (COMMIT_MAKER_CLAUDE_API_KEY / ANTHROPIC_API_KEY / anthropic_api_key)');
  }

  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  console.log('Claude OK');
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
