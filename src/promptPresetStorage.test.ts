import type * as vscode from 'vscode';
import assert from 'assert';
import { loadPromptPresetsFromStorage, persistPromptPresets } from './promptPresetStorage';
import { PROMPT_PRESETS } from './constants';

// 実ストレージを触らず、global と workspace の保存先を別のキーで再現する。
function createMockContext() {
  const store = new Map<string, unknown>();
  return {
    globalState: {
      get: <T>(key: string, def?: T) => (store.has(key) ? (store.get(key) as T) : def),
      update: async (key: string, value: unknown) => {
        store.set(key, value);
      }
    },
    workspaceState: {
      get: <T>(key: string, def?: T) => (store.has('ws:' + key) ? (store.get('ws:' + key) as T) : def),
      update: async (key: string, value: unknown) => {
        store.set('ws:' + key, value);
      }
    }
  } as unknown as vscode.ExtensionContext;
}

async function testLoadFallsBackToDefault(): Promise<void> {
  const ctx = createMockContext();
  const { presets, activeId } = loadPromptPresetsFromStorage(ctx);
  assert.strictEqual(presets[0].id, PROMPT_PRESETS[0].id);
  assert.strictEqual(activeId, presets[0].id);
}

async function testPersistAndLoad(): Promise<void> {
  const ctx = createMockContext();
  const custom = [{ id: 'x', label: 'x', prompt: 'p' }];
  await persistPromptPresets(ctx, custom, 'x');
  const { presets, activeId } = loadPromptPresetsFromStorage(ctx);
  assert.ok(presets.find(p => p.id === 'x'));
  assert.strictEqual(activeId, 'x');
}

export async function runPromptPresetStorageTests(): Promise<void> {
  await testLoadFallsBackToDefault();
  await testPersistAndLoad();
  console.log('promptPresetStorage.test.ts passed');
}
