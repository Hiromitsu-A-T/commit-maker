import assert from 'assert';
import { callGemini } from './gemini';

import { withMockFetch } from '../../testSupport';

async function testGeminiUsesHeaderKeyOnly(): Promise<void> {
  await withMockFetch(async (url, options) => {
    const requestedUrl = new URL(String(url));
    assert.strictEqual(requestedUrl.searchParams.has('key'), false);
    assert.strictEqual(new Headers(options?.headers).get('x-goog-api-key'), 'test-gemini-key');
    assert.strictEqual(
      String(url),
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'ok' }] } }] }));
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
    assert.strictEqual(new Headers(options?.headers).get('x-goog-api-key'), 'test-gemini-key');
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }));
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

async function testGeminiRejectsTruncatedOutput(): Promise<void> {
  for (const text of ['fix: unfinished', '']) {
    await withMockFetch(async () => new Response(JSON.stringify({ candidates: [{
      finishReason: 'MAX_TOKENS', content: { parts: [{ text }] }
    }] })), async () => {
      await assert.rejects(() => callGemini({
        prompt: 'ping', model: 'gemini-3.5-flash-lite', apiKey: 'test-gemini-key',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', timeoutMs: 1000
      }), /MAX_TOKENS/);
    });
  }
}

export async function runGeminiLlmTests(): Promise<void> {
  await testGeminiUsesHeaderKeyOnly();
  await testGeminiDropsEndpointKeyQuery();
  await testGeminiRejectsTruncatedOutput();
  console.log('gemini.test.ts passed');
}
