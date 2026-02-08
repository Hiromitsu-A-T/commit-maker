async function main(): Promise<void> {
  const key =
    process.env.COMMIT_MAKER_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.openai_api_key;
  const model =
    process.env.COMMIT_MAKER_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini';

  if (!key) {
    throw new Error('OpenAI API key not found in env (COMMIT_MAKER_OPENAI_API_KEY / OPENAI_API_KEY / openai_api_key)');
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input: [{ role: 'user', content: [{ type: 'input_text', text: 'ping' }] }],
      max_output_tokens: 20,
      temperature: 0,
      text: { format: { type: 'text' } }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} (${model}): ${text || res.statusText}`);
  }

  console.log(`OpenAI responses OK with model ${model}`);
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
