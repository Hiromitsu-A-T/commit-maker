import assert from 'assert';
import {
  DEFAULT_LOCAL_MODEL_SHA256,
  DEFAULT_LOCAL_MODEL_URL
} from '../constants';
import { getLocalModelDefinition } from './localModel';

function createConfig(values: Record<string, string | undefined> = {}) {
  return {
    inspect: (key: string) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return { globalValue: values[key] };
      }
      return undefined;
    },
    get: (key: string, fallback: string) => values[key] ?? fallback
  } as any;
}

export async function runLocalModelTests(): Promise<void> {
  const defaults = getLocalModelDefinition(createConfig());
  assert.strictEqual(defaults.url, DEFAULT_LOCAL_MODEL_URL);
  assert.strictEqual(defaults.sha256, DEFAULT_LOCAL_MODEL_SHA256);

  const customUrl = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf'
  }));
  assert.strictEqual(customUrl.url, 'https://example.com/model.gguf');
  assert.strictEqual(customUrl.sha256, '');

  const customSha = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf',
    localModelSha256: 'abc123',
    localModelFilename: '../custom.gguf'
  }));
  assert.strictEqual(customSha.sha256, 'abc123');
  assert.strictEqual(customSha.filename, 'custom.gguf');

  console.log('localModel.test.ts passed');
}
