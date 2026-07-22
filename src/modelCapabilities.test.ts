import * as assert from 'assert';
import {
  DEFAULT_MODEL_BY_PROVIDER,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_VERBOSITY,
  MODEL_SUGGESTIONS_BY_PROVIDER,
  REASONING_EFFORT_OPTIONS
} from './constants';
import {
  getAllowedReasoningOptions,
  getAllowedVerbosityOptions,
  getDefaultReasoningForModel
} from './modelCapabilities';
import { resolveReasoningSetting, resolveVerbositySetting } from './defaults';
import { isReasoningEffort } from './types';

export function runModelCapabilitiesTests(): void {
  const packageProperties = require('../package.json').contributes.configuration.properties;
  assert.strictEqual(packageProperties['commitMaker.reasoningEffort'].default, DEFAULT_REASONING_EFFORT);
  assert.strictEqual(packageProperties['commitMaker.verbosity'].default, DEFAULT_VERBOSITY);
  assert.ok(packageProperties['commitMaker.reasoningEffort'].enum.includes('max'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.gemini, 'gemini-3.5-flash-lite');
  assert.strictEqual(MODEL_SUGGESTIONS_BY_PROVIDER.gemini[0], 'gemini-3.5-flash-lite');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.6-flash'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.1-pro-preview'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.1-flash-lite'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3.5-flash'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-3-flash-preview'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.gemini.includes('gemini-2.5-pro'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.openai, 'gpt-5.6-luna');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.6-sol'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.6-terra'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.6-luna'));
  assert.deepStrictEqual(
    getAllowedReasoningOptions('gpt-5.6-sol'),
    ['none', 'low', 'medium', 'high', 'xhigh', 'max']
  );
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.5'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.5-pro'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.4-pro'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.3-codex'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.2'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.2-pro'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.2-codex'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.1'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.1-codex'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.1-codex-max'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.openai.includes('gpt-5.1-codex-mini'));
  for (const model of MODEL_SUGGESTIONS_BY_PROVIDER.openai) {
    assert.ok(getAllowedReasoningOptions(model), `${model} must have explicit reasoning capabilities`);
  }
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.5'), ['none', 'low', 'medium', 'high', 'xhigh']);
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.4-nano'), ['none', 'low', 'medium', 'high', 'xhigh']);
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.2-pro'), ['medium', 'high', 'xhigh']);
  assert.deepStrictEqual(getAllowedReasoningOptions('gpt-5.1-codex-max'), ['low', 'medium', 'high', 'xhigh']);
  assert.deepStrictEqual(getAllowedVerbosityOptions('gpt-5.2-codex'), ['medium']);
  assert.strictEqual(getAllowedVerbosityOptions('gpt-5.3-codex'), undefined);
  assert.strictEqual(getDefaultReasoningForModel('gpt-5.6-luna'), 'medium');
  assert.strictEqual(getDefaultReasoningForModel('gpt-5.4-nano'), 'none');
  assert.strictEqual(getDefaultReasoningForModel('gpt-5.5-pro'), 'high');
  assert.ok(REASONING_EFFORT_OPTIONS.includes('xhigh'));
  assert.ok(REASONING_EFFORT_OPTIONS.includes('max'));
  assert.ok(isReasoningEffort('xhigh'));
  assert.ok(isReasoningEffort('max'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.claude, 'claude-haiku-4-5');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-sonnet-4-6'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-8'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-7'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-6'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-sonnet-5'));
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-fable-5'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-1-20250805'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-opus-4-20250514'));
  assert.ok(!MODEL_SUGGESTIONS_BY_PROVIDER.claude.includes('claude-sonnet-4-20250514'));

  assert.strictEqual(DEFAULT_MODEL_BY_PROVIDER.codex, 'gpt-5.5');
  assert.ok(MODEL_SUGGESTIONS_BY_PROVIDER.codex.includes('gpt-5.4-mini'));

  assert.strictEqual(resolveReasoningSetting(undefined, 'high'), 'high');
  assert.strictEqual(resolveReasoningSetting('low', 'high'), 'low');
  assert.strictEqual(resolveReasoningSetting('invalid', 'invalid'), 'medium');
  assert.strictEqual(resolveVerbositySetting(undefined, 'low'), 'low');
  assert.strictEqual(resolveVerbositySetting('high', 'low'), 'high');
  assert.strictEqual(resolveVerbositySetting('invalid', 'invalid'), 'medium');
}
