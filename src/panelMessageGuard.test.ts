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
  shouldFail({});
  shouldFail({ type: 'commitPromptChanged', value: 1 });
  shouldFail({ type: 'unknown' });
  console.log('panelMessageGuard.test.ts passed');
}
