import assert from 'assert';
import { loadPromptPresetsFromStorage, persistPromptPresets } from './promptPresetStorage';
import { PROMPT_PRESETS } from './constants';

// Simple in-memory mock for vscode.ExtensionContext state
function createMockContext() {
  const store = new Map<string, any>();
  return {
    globalState: {
      get: <T>(key: string, def?: T) => (store.has(key) ? (store.get(key) as T) : def),
      update: async (key: string, value: any) => {
        store.set(key, value);
      }
    },
    workspaceState: {
      get: <T>(key: string, def?: T) => (store.has('ws:' + key) ? (store.get('ws:' + key) as T) : def),
      update: async (key: string, value: any) => {
        store.set('ws:' + key, value);
      }
    }
  } as any;
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
  await persistPromptPresets(ctx, custom as any, 'x');
  const { presets, activeId } = loadPromptPresetsFromStorage(ctx);
  assert.ok(presets.find(p => p.id === 'x'));
  assert.strictEqual(activeId, 'x');
}

export async function runPromptPresetStorageTests(): Promise<void> {
  await testLoadFallsBackToDefault();
  await testPersistAndLoad();
  console.log('promptPresetStorage.test.ts passed');
}
