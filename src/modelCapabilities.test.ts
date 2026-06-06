import * as assert from 'assert';
import {
  DEFAULT_MODEL_BY_PROVIDER,
  MODEL_SUGGESTIONS_BY_PROVIDER,
  REASONING_EFFORT_OPTIONS
} from './constants';
import { getAllowedReasoningOptions } from './modelCapabilities';
import { isReasoningEffort } from './types';

export function runModelCapabilitiesTests(): void {
  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.gemini, 'gemini-2.5-flash-lite');
  assert.strictEqual(MODEL_SUGGESTIONS_BY_PROVIDER.gemini[0], 'gemini-2.5-flash-lite');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.1-flash-lite'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.5-flash'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3-flash-preview'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.openai, 'gpt-5.4-nano');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.5'));
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.5'), ['none', 'low', 'medium', 'high', 'xhigh']);
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.4-nano'), ['none', 'low', 'medium', 'high', 'xhigh']);
  assert.ok(REASONING_EFFORT_OPTIONS.includes('xhigh'));
  assert.ok(isReasoningEffort('xhigh'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.claude, 'claude-haiku-4-5');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-sonnet-4-6'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-8'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.codex, 'gpt-5.5');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.codex.includes('gpt-5.4-mini'));
}
