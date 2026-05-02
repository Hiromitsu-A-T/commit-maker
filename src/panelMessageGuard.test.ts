import assert from 'assert';
import { sanitizeMessage } from './panelMessageGuard';

function shouldPass(msg: any) {
  const res = sanitizeMessage(msg);
  assert.ok(res, `should sanitize: ${JSON.stringify(msg)}`);
}

function shouldFail(msg: any) {
  const res = sanitizeMessage(msg);
  assert.strictEqual(res, undefined, `should reject: ${JSON.stringify(msg)}`);
}

export async function runPanelMessageGuardTests(): Promise<void> {
  shouldPass({ type: 'ready' });
  shouldPass({ type: 'commitPromptChanged', value: 'x' });
  shouldPass({ type: 'commitIncludeBinaryChanged', value: true });
  shouldPass({ type: 'localModelChanged', value: 'Qwen3-4B-Instruct-2507-Q4_K_M' });
  shouldPass({ type: 'localModelDownload' });
  shouldPass({ type: 'localModelCancelDownload' });
  shouldPass({ type: 'localModelDelete' });
  shouldPass({ type: 'localModelTest' });
  shouldPass({ type: 'localModelRefresh' });
  shouldFail({});
  shouldFail({ type: 'commitPromptChanged', value: 1 });
  shouldFail({ type: 'unknown' });
  console.log('panelMessageGuard.test.ts passed');
}
