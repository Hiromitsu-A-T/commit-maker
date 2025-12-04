import assert from 'assert';
import { callLlmJson } from './shared';

type FetchMock = typeof fetch;

function withMockFetch(mock: FetchMock, fn: () => Promise<void>): Promise<void> {
  const original = global.fetch;
  global.fetch = mock;
  return fn().finally(() => {
    global.fetch = original;
  });
}

async function testSuccessNoRetry(): Promise<void> {
  let called = 0;
  await withMockFetch(async (url, options) => {
    called += 1;
    assert.ok(options?.signal, 'signal should be passed');
    return {
      ok: true,
      status: 200,
      text: async () => 'ok'
    } as any;
  }, async () => {
    const result = await callLlmJson({
      label: 'Test',
      endpoint: 'https://example.com/responses',
      timeoutMs: 1000,
      buildRequest: base => ({ url: base, headers: {}, body: {} }),
      parse: raw => raw
    });
    assert.strictEqual(result, 'ok');
    assert.strictEqual(called, 1);
  });
}

async function testRetryOn429(): Promise<void> {
  let attempts = 0;
  await withMockFetch(async () => {
    attempts += 1;
    if (attempts < 3) {
      return {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'rate'
      } as any;
    }
    return {
      ok: true,
      status: 200,
      text: async () => 'final'
    } as any;
  }, async () => {
    const result = await callLlmJson({
      label: 'Test',
      endpoint: 'https://example.com/responses',
      timeoutMs: 5000,
      buildRequest: base => ({ url: base, headers: {}, body: {} }),
      parse: raw => raw
    });
    assert.strictEqual(result, 'final');
    assert.strictEqual(attempts, 3);
  });
}

async function testTimeoutAbort(): Promise<void> {
  class AbortErr extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AbortError';
    }
  }
  await withMockFetch(async (_url, options) => {
    return new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => {
        reject(new AbortErr('Aborted'));
      });
    });
  }, async () => {
    let threw = false;
    try {
      await callLlmJson({
        label: 'Test',
        endpoint: 'https://example.com/responses',
        timeoutMs: 10,
        buildRequest: base => ({ url: base, headers: {}, body: {} }),
        parse: raw => raw
      });
    } catch (error) {
      threw = true;
      const err = error as any;
      assert.ok(err.name === 'AbortError' || String(err).includes('Abort'), 'should abort on timeout');
    }
    assert.ok(threw, 'timeout should throw');
  });
}

export async function runSharedLlmTests(): Promise<void> {
  await testSuccessNoRetry();
  await testRetryOn429();
  await testTimeoutAbort();
  console.log('shared.test.ts passed');
}
