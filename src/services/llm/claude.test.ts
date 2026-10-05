import assert from 'assert';
import { callClaude } from './claude';

import { withMockFetch } from '../../testSupport';

async function testOpus48OmitsTemperature(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ content: [{ text: 'ok' }] }));
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
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ content: [{ text: 'ok' }] }));
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

async function testSonnet5OmitsTemperature(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }));
  }, async () => {
    await callClaude({
      prompt: 'ping',
      model: 'claude-sonnet-5',
      apiKey: 'test-key',
      endpoint: 'https://api.anthropic.com/v1/messages',
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'temperature'));
}

async function testOpus55OmitsTemperature(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }));
  }, async () => {
    await callClaude({
      prompt: 'ping',
      model: 'claude-opus-5-5',
      apiKey: 'test-key',
      endpoint: 'https://api.anthropic.com/v1/messages',
      timeoutMs: 1000
    });
  });

  assert.strictEqual(bodies.length, 1);
  assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'temperature'));
}

async function testFable51ReadsTextAfterThinkingBlock(): Promise<void> {
  const bodies: Record<string, unknown>[] = [];
  const result = await withMockFetch(async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({
        content: [
          { type: 'thinking', thinking: '' },
          { type: 'text', text: 'ok' }
        ]
      }));
  }, async () => callClaude({
    prompt: 'ping',
    model: 'claude-fable-5-1',
    apiKey: 'test-key',
    endpoint: 'https://api.anthropic.com/v1/messages',
    timeoutMs: 1000
  }));

  assert.strictEqual(result, 'ok');
  assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'temperature'));
}

export async function runClaudeLlmTests(): Promise<void> {
  await testOpus48OmitsTemperature();
  await testSonnet46KeepsTemperature();
  await testSonnet5OmitsTemperature();
  await testOpus55OmitsTemperature();
  await testFable51ReadsTextAfterThinkingBlock();
  console.log('claude.test.ts passed');
}
