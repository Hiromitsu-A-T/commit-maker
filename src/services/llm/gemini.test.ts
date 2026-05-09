import assert from 'assert';
import { callGemini } from './gemini';

type FetchMock = typeof fetch;

function withMockFetch(mock: FetchMock, fn: () => Promise<void>): Promise<void> {
  const original = global.fetch;
  global.fetch = mock;
  return fn().finally(() => {
    global.fetch = original;
  });
}

function getHeader(headers: unknown, name: string): string | undefined {
  if (!headers) return undefined;
  const maybeHeaders = headers as { get?: unknown };
  if (typeof maybeHeaders.get === 'function') {
    return (maybeHeaders as { get(key: string): string | null }).get(name) ?? undefined;
  }
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  }
  return (headers as Record<string, string>)[name];
}

async function testGeminiUsesHeaderKeyOnly(): Promise<void> {
  await withMockFetch(async (url, options) => {
    const requestedUrl = new URL(String(url));
    assert.strictEqual(requestedUrl.searchParams.has('key'), false);
    assert.strictEqual(getHeader(options?.headers, 'x-goog-api-key'), 'test-gemini-key');
    assert.strictEqual(
      String(url),
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] })
    } as any;
  }, async () => {
    const result = await callGemini({
      prompt: 'ping',
      model: 'gemini-2.5-flash',
      apiKey: 'test-gemini-key',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      timeoutMs: 1000
    });
    assert.strictEqual(result, 'ok');
  });
}

async function testGeminiDropsEndpointKeyQuery(): Promise<void> {
  await withMockFetch(async (url, options) => {
    const requestedUrl = new URL(String(url));
    assert.strictEqual(requestedUrl.searchParams.has('key'), false);
    assert.strictEqual(requestedUrl.searchParams.get('alt'), 'json');
    assert.strictEqual(getHeader(options?.headers, 'x-goog-api-key'), 'test-gemini-key');
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] })
    } as any;
  }, async () => {
    const result = await callGemini({
      prompt: 'ping',
      model: 'gemini-2.5-flash',
      apiKey: 'test-gemini-key',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=leaky&alt=json',
      timeoutMs: 1000
    });
    assert.strictEqual(result, 'ok');
  });
}

export async function runGeminiLlmTests(): Promise<void> {
  await testGeminiUsesHeaderKeyOnly();
  await testGeminiDropsEndpointKeyQuery();
  console.log('gemini.test.ts passed');
}
