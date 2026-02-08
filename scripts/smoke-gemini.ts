async function main(): Promise<void> {
  const key =
    process.env.COMMIT_MAKER_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.google_api_key;

  if (!key) {
    throw new Error('Gemini API key not found in env (COMMIT_MAKER_GEMINI_API_KEY / GOOGLE_API_KEY / google_api_key)');
  }

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': key }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  console.log('Gemini OK');
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
