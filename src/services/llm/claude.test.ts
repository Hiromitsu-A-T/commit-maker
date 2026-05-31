import assert from 'assert';
import { callClaude } from './claude';

type FetchMock = typeof fetch;

function withMockFetch(mock: FetchMock, fn: () => Promise<void>): Promise<void> {
  const original = global.fetch;
  global.fetch = mock;
  return fn().finally(() => {
    global.fetch = original;
  });
}

async function testOpus48OmitsTemperature(): Promise<void> {
  const bodies: any[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ content: [{ text: 'ok' }] })
    } as any;
  }, async () => {
    await callClaude({
      prompt: 'ping',
      model: 'claude-opus-4-8',
      apiKey: 'test-key',
      endpoint: 'https://api.anthropic.com/v1/messages',
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.strictEqual(bodies[0].model, 'claude-opus-4-8');
  assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'temperature'));
}

async function testSonnet46KeepsTemperature(): Promise<void> {
  const bodies: any[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ content: [{ text: 'ok' }] })
    } as any;
  }, async () => {
    await callClaude({
      prompt: 'ping',
      model: 'claude-sonnet-4-6',
      apiKey: 'test-key',
      endpoint: 'https://api.anthropic.com/v1/messages',
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.strictEqual(bodies[0].temperature, 0);
}

export async function runClaudeLlmTests(): Promise<void> {
  await testOpus48OmitsTemperature();
  await testSonnet46KeepsTemperature();
  console.log('claude.test.ts passed');
}
