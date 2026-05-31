import assert from 'assert';
import { callOpenAi } from './openai';

type FetchMock = typeof fetch;

function withMockFetch(mock: FetchMock, fn: () => Promise<void>): Promise<void> {
  const original = global.fetch;
  global.fetch = mock;
  return fn().finally(() => {
    global.fetch = original;
  });
}

async function testGpt54ReasoningBody(): Promise<void> {
  const bodies: any[] = [];
  await withMockFetch(async (url, options) => {
    const target = String(url);
    if (target.endsWith('/v1/models')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'gpt-5.4-nano' }, { id: 'gpt-5.5' }]
        })
      } as any;
    }
    bodies.push(JSON.parse(String(options?.body)));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ output_text: 'ok' })
    } as any;
  }, async () => {
    await callOpenAi({
      prompt: 'ping',
      model: 'gpt-5.4-nano',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'xhigh',
      verbosity: 'high',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.strictEqual(bodies[0].model, 'gpt-5.4-nano');
  assert.deepStrictEqual(bodies[0].reasoning, { effort: 'xhigh' });
  assert.deepStrictEqual(bodies[0].text, { format: { type: 'text' }, verbosity: 'high' });
  assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'temperature'));
}

async function testGpt54InvalidReasoningFallsBack(): Promise<void> {
  const bodies: any[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ output_text: 'ok' })
    } as any;
  }, async () => {
    await callOpenAi({
      prompt: 'ping',
      model: 'gpt-5.4-nano',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'minimal',
      verbosity: 'medium',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.deepStrictEqual(bodies[0].reasoning, { effort: 'none' });
  assert.strictEqual(bodies[0].temperature, 0);
}

export async function runOpenAiLlmTests(): Promise<void> {
  await testGpt54ReasoningBody();
  await testGpt54InvalidReasoningFallsBack();
  console.log('openai.test.ts passed');
}
