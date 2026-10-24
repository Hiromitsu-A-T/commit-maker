import * as http from 'http';
import { readBoundedText } from '../httpResponse';
import assert from 'assert';
import { callLlmJson, createAbortController, postJsonWithBackoff, sanitizeLlmErrorText } from './shared';

import { withMockFetch } from '../../testSupport';

async function testSuccessNoRetry(): Promise<void> {
  let called = 0;
  await withMockFetch(async (_url, options) => {
    called += 1;
    assert.ok(options?.signal, 'signal should be passed');
    return new Response('ok');
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
      return new Response('rate', { status: 429, statusText: 'Too Many Requests' });
    }
    return new Response('final');
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
  await withMockFetch(async (_url, options) => {
    return new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }, async () => {
    await assert.rejects(() => callLlmJson({
      label: 'Test',
      endpoint: 'https://example.com/responses',
      timeoutMs: 10,
      buildRequest: base => ({ url: base, headers: {}, body: {} }),
      parse: raw => raw
    }), { name: 'AbortError' });
  });
}

async function testSanitizeLlmErrorText(): Promise<void> {
  const text = [
    'Bearer sk-proj-abcdefghijklmnopqrstuvwxyz123456',
    'sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456',
    'AIzaabcdefghijklmnopqrstuvwxyz1234567890'
  ].join('\n');
  const sanitized = sanitizeLlmErrorText(text);
  assert(!sanitized.includes('sk-proj-abcdefghijklmnopqrstuvwxyz123456'));
  assert(!sanitized.includes('sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456'));
  assert(!sanitized.includes('AIzaabcdefghijklmnopqrstuvwxyz1234567890'));
  assert(sanitized.includes('[REDACTED_API_KEY]'));
}

async function testSecurityBoundaries(): Promise<void> {
  let destinationRequests = 0;
  const destination = http.createServer((_req, res) => { destinationRequests++; res.end('leaked'); });
  await new Promise<void>(resolve => destination.listen(0, '127.0.0.1', resolve));
  const address = destination.address() as import('net').AddressInfo;
  let status = 307;
  const source = http.createServer((_req, res) => {
    res.writeHead(status, { location: `http://127.0.0.1:${address.port}/private` }); res.end();
  });
  await new Promise<void>(resolve => source.listen(0, '127.0.0.1', resolve));
  const sourceAddress = source.address() as import('net').AddressInfo;
  try {
    for (status of [301, 302, 303, 307, 308]) {
      await assert.rejects(() => postJsonWithBackoff(`http://127.0.0.1:${sourceAddress.port}`, {
        headers: { 'x-api-key': 'fixture-secret' }, body: { prompt: 'private-fixture' },
        controller: new AbortController(), label: 'fixture', parse: text => text
      }), /redirects/);
    }
    assert.strictEqual(destinationRequests, 0, 'redirect先へ本文・キーを送らない');
    await assert.rejects(() => readBoundedText(new Response('small', { headers: { 'content-length': '10000000' } })), /byte limit/);
    let cancelled = false;
    const oversized = new Response(new ReadableStream({
      pull(stream) { stream.enqueue(new Uint8Array(1024)); },
      cancel() { cancelled = true; }
    }), { headers: { 'content-length': '1' } });
    await assert.rejects(() => readBoundedText(oversized, 2048), /byte limit/);
    assert.ok(cancelled, '過少申告されたstreamも上限で中止する');
    assert.strictEqual(await readBoundedText(new Response('正常な応答')), '正常な応答');
  } finally {
    source.closeAllConnections(); destination.closeAllConnections();
    await Promise.all([new Promise<void>(resolve => source.close(() => resolve())),
      new Promise<void>(resolve => destination.close(() => resolve()))]);
  }
}

export async function runSharedLlmTests(): Promise<void> {
  let attempts = 0;
  await withMockFetch(async () => {
    attempts++;
    return new Response('input 429 is invalid', { status: 400 });
  }, async () => {
    await assert.rejects(() => callLlmJson({
      label: 'Test', endpoint: 'https://example.com', timeoutMs: 3000,
      buildRequest: url => ({ url, headers: {}, body: {} }), parse: text => text
    }), /400/);
    assert.strictEqual(attempts, 1, '本文の429で400を再試行しない');
  });
  attempts = 0;
  await withMockFetch(async () => {
    if (++attempts === 1) throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
    return new Response('recovered');
  }, async () => {
    assert.strictEqual(await callLlmJson({
      label: 'Test', endpoint: 'https://example.com', timeoutMs: 3000,
      buildRequest: url => ({ url, headers: {}, body: {} }), parse: text => text
    }), 'recovered');
    assert.strictEqual(attempts, 2, 'fetch の cause にある一時エラーを再試行する');
  });
  await withMockFetch(async () => new Response('rate limit', { status: 429 }), async () => {
    const controller = new AbortController();
    const start = Date.now();
    await assert.rejects(() => postJsonWithBackoff('https://example.com', {
      headers: {}, body: {}, controller, label: 'Test', parse: text => text
    }, 3, message => { if (message.includes('500')) controller.abort(); }), { name: 'AbortError' });
    assert.ok(Date.now() - start < 400, '中止時は再試行の500ms待機も終了する');
  });
  const parent = new AbortController();
  parent.abort();
  const combined = createAbortController(parent.signal, 1000);
  assert.strictEqual(combined.controller.signal.aborted, true, '既に中止された親を引き継ぐ');
  combined.dispose();
  await withMockFetch(async () => {
    throw new Error('中止済みのリクエストは送信しない');
  }, async () => {
    await assert.rejects(() => callLlmJson({
      label: 'Test', endpoint: 'https://example.com', abortSignal: parent.signal, timeoutMs: 1000,
      buildRequest: url => ({ url, headers: {}, body: {} }), parse: text => text
    }), { name: 'AbortError' });
  });
  await testSecurityBoundaries();
  await testSuccessNoRetry();
  await testRetryOn429();
  await testTimeoutAbort();
  await testSanitizeLlmErrorText();
  console.log('shared.test.ts passed');
}
