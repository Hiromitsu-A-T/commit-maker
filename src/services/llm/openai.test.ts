import assert from 'assert';
import { callOpenAi } from './openai';
import { MODEL_SUGGESTIONS_BY_PROVIDER } from '../../constants';

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
          data: [
            ...MODEL_SUGGESTIONS_BY_PROVIDER.openai,
            'gpt-5.2-pro',
            'gpt-5.2-codex'
          ].map(id => ({ id }))
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

async function testGpt56MaxReasoningBody(): Promise<void> {
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
      model: 'gpt-5.6-sol',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'max',
      verbosity: 'high',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.strictEqual(bodies[0].model, 'gpt-5.6-sol');
  assert.deepStrictEqual(bodies[0].reasoning, { effort: 'max' });
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

async function testIntermediateModelConstraints(): Promise<void> {
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
      model: 'gpt-5.2-pro',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'none',
      verbosity: 'high',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
    await callOpenAi({
      prompt: 'ping',
      model: 'gpt-5.5-pro',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'none',
      verbosity: 'low',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
    await callOpenAi({
      prompt: 'ping',
      model: 'gpt-5.2-codex',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'low',
      verbosity: 'low',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
    await callOpenAi({
      prompt: 'ping',
      model: 'gpt-5.3-codex',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      reasoning: 'xhigh',
      verbosity: 'high',
      maxOutputTokens: 8,
      timeoutMs: 1000
    });
  });

  assert.deepStrictEqual(bodies[0].reasoning, { effort: 'medium' });
  assert.deepStrictEqual(bodies[0].text, { format: { type: 'text' }, verbosity: 'high' });
  assert.deepStrictEqual(bodies[1].reasoning, { effort: 'high' });
  assert.deepStrictEqual(bodies[1].text, { format: { type: 'text' }, verbosity: 'low' });
  assert.deepStrictEqual(bodies[2].reasoning, { effort: 'low' });
  assert.deepStrictEqual(bodies[2].text, { format: { type: 'text' }, verbosity: 'medium' });
  assert.deepStrictEqual(bodies[3].reasoning, { effort: 'xhigh' });
  assert.deepStrictEqual(bodies[3].text, { format: { type: 'text' }, verbosity: 'high' });
}

async function testRejectsHttpEndpointBeforeModelFetch(): Promise<void> {
  let fetchCalled = false;
  await withMockFetch(async () => {
    fetchCalled = true;
    throw new Error('fetch should not be called');
  }, async () => {
    await assert.rejects(
      () => callOpenAi({
        prompt: 'ping',
        model: 'gpt-5.4-nano',
        apiKey: 'test-key',
        endpoint: 'http://127.0.0.1:8080/v1/responses',
        reasoning: 'none',
        verbosity: 'medium',
        maxOutputTokens: 8,
        timeoutMs: 1000
      }),
      /https:\/\//
    );
  });
  assert.strictEqual(fetchCalled, false, 'HTTP endpoints must be rejected before model preflight');
}

export async function runOpenAiLlmTests(): Promise<void> {
  await testGpt54ReasoningBody();
  await testGpt56MaxReasoningBody();
  await testGpt54InvalidReasoningFallsBack();
  await testIntermediateModelConstraints();
  await testRejectsHttpEndpointBeforeModelFetch();
  console.log('openai.test.ts passed');
}
