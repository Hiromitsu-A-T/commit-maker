import assert from 'assert';
import { callOpenAi } from './openai';
import { MODEL_SUGGESTIONS_BY_PROVIDER } from '../../constants';
import { DEFAULT_LANGUAGE, getStrings } from '../../i18n/strings';

import { withMockFetch } from '../../testSupport';

async function testGpt54ReasoningBody(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (url, options) => {
    const target = String(url);
    if (target.endsWith('/v1/models')) {
      return new Response(JSON.stringify({
          data: [
            ...MODEL_SUGGESTIONS_BY_PROVIDER.openai,
            'gpt-5.2-pro',
            'gpt-5.2-codex'
          ].map(id => ({ id }))
        }));
    }
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ output_text: 'ok' }));
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
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ output_text: 'ok' }));
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

async function testGpt6ReasoningBody(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (url, options) => {
    if (String(url).endsWith('/v1/models')) {
      return new Response(JSON.stringify({
        data: MODEL_SUGGESTIONS_BY_PROVIDER.openai.map(id => ({ id }))
      }));
    }
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ output_text: 'ok' }));
  }, async () => {
    const base = {
      prompt: 'ping',
      apiKey: 'test-key',
      endpoint: 'https://api.openai.com/v1/responses',
      verbosity: 'high' as const,
      maxOutputTokens: 8,
      timeoutMs: 1000
    };
    await callOpenAi({ ...base, model: 'gpt-6-luna', reasoning: 'max' });
    await callOpenAi({ ...base, model: 'gpt-6-astra', reasoning: 'none' });
    await callOpenAi({ ...base, model: 'gpt-6.1-sol', reasoning: 'none' });
    await callOpenAi({ ...base, model: 'gpt-6.1-sol', reasoning: 'minimal' });
    await callOpenAi({ ...base, model: 'gpt-6.1-sol', reasoning: 'max' });
  });

  assert.deepStrictEqual(bodies.map(body => body.model), [
    'gpt-6-luna', 'gpt-6-astra', 'gpt-6.1-sol', 'gpt-6.1-sol', 'gpt-6.1-sol'
  ]);
  assert.deepStrictEqual(bodies[0].reasoning, { effort: 'max' });
  assert.deepStrictEqual(bodies[1].reasoning, { effort: 'low' });
  assert.deepStrictEqual(bodies[2].reasoning, { effort: 'medium' });
  assert.deepStrictEqual(bodies[3].reasoning, { effort: 'medium' });
  assert.deepStrictEqual(bodies[4].reasoning, { effort: 'max' });
  assert.ok(bodies.every(body => !Object.prototype.hasOwnProperty.call(body, 'temperature')));
}

async function testGpt54InvalidReasoningFallsBack(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ output_text: 'ok' }));
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
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ output_text: 'ok' }));
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
  await testGpt6ReasoningBody();
  await testGpt54InvalidReasoningFallsBack();
  await testIntermediateModelConstraints();
  await testRejectsHttpEndpointBeforeModelFetch();
  await testModelCacheIsolation();
  await testModelPreflightCancellation();
  await testResponseContracts();
  console.log('openai.test.ts passed');
}

async function testResponseContracts(): Promise<void> {
  const params = { prompt: 'ping', model: 'custom-model', apiKey: 'fixture-formats',
    endpoint: 'https://fixture-formats.example/v1/responses', maxOutputTokens: 8, timeoutMs: 1000 };
  let payload: unknown;
  await withMockFetch(async url => new Response(JSON.stringify(String(url).endsWith('/v1/models')
    ? { data: [null, {}, { id: 42 }, { id: 'custom-model' }] } : payload)), async () => {
    const formats: [unknown, string][] = [
      [{ output_text: 'direct' }, 'direct'],
      [{ output: [null, { content: [null, { text: 'one' }, { output_text: 'two' }, 'three'] }] }, 'one\ntwo\nthree'],
      [{ outputs: [{ message: { content: [{ text: 'message' }] } }] }, 'message'],
      [{ output: [{ message: { content: 'message-string' } }] }, 'message-string'],
      [{ response_text: 'legacy' }, 'legacy'],
      [{ choices: [{ message: { content: 'chat' } }] }, 'chat']
    ];
    for (const [response, expected] of formats) {
      payload = response;
      assert.strictEqual(await callOpenAi(params), expected);
    }
    for (const response of [null, [], { output_text: 42 }, { output: [{ content: [{ text: 42 }] }] },
      { response_text: 42 }, { choices: [null] }, { choices: [{ message: { content: 42 } }] }]) {
      payload = response;
      await assert.rejects(() => callOpenAi(params), { message: getStrings(DEFAULT_LANGUAGE).msgLlmEmptyOpenAi });
    }
    for (const output of ['', 'fix: unfinished']) {
      payload = { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: output };
      await assert.rejects(() => callOpenAi(params), { message: 'OpenAI: response incomplete (max_output_tokens).' });
    }
    payload = { status: 'failed', error: { message: 'Rejected Bearer sk-proj-fixture1234567890' }, output_text: 'fix: unfinished' };
    await assert.rejects(() => callOpenAi(params), { message: 'OpenAI: response failed (Rejected Bearer [REDACTED]).' });
    payload = { status: 'incomplete', incomplete_details: null, output_text: 'fix: unfinished' };
    await assert.rejects(() => callOpenAi(params), { message: 'OpenAI: response incomplete.' });
    payload = { status: 'completed', output_text: 'fix: complete' };
    assert.strictEqual(await callOpenAi(params), 'fix: complete');
  });
}

async function testModelCacheIsolation(): Promise<void> {
  const requests: string[] = [];
  await withMockFetch(async (url, options) => {
    if (String(url).endsWith('/v1/models')) {
      requests.push(`${url}:${(options?.headers as Record<string, string>).Authorization}`);
      return new Response(JSON.stringify({ data: [{ id: 'custom-model' }] }));
    }
    return new Response(JSON.stringify({ output_text: 'ok' }));
  }, async () => {
    const params = { prompt: 'ping', model: 'custom-model', apiKey: 'fixture-a',
      endpoint: 'https://fixture-a.example/v1/responses', maxOutputTokens: 8, timeoutMs: 1000 };
    await callOpenAi(params);
    await callOpenAi(params);
    await callOpenAi({ ...params, apiKey: 'fixture-b' });
    await callOpenAi({ ...params, endpoint: 'https://fixture-b.example/v1/responses' });
    assert.strictEqual(requests.length, 3, '同じ認証・接続先だけがキャッシュを共有する');
  });
}

async function testModelPreflightCancellation(): Promise<void> {
  let calls = 0;
  await withMockFetch(async (_url, options) => {
    calls += 1;
    return new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  }, async () => {
    await assert.rejects(() => callOpenAi({
      prompt: 'ping', model: 'custom-model', apiKey: 'fixture-timeout',
      endpoint: 'https://fixture-timeout.example/v1/responses', maxOutputTokens: 8, timeoutMs: 10
    }), { name: 'AbortError' });
    assert.strictEqual(calls, 1, 'モデル一覧取得の中止後に生成を送信しない');
  });
}
