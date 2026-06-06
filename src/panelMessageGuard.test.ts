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
  shouldPass({ type: 'commitProviderChanged', value: 'gemini' });
  shouldPass({ type: 'commitIncludeBinaryChanged', value: true });
  shouldPass({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 12000.8 } });
  shouldPass({ type: 'commitReasoningChanged', value: 'medium' });
  shouldPass({ type: 'commitCodexReasoningChanged', value: 'high' });
  shouldPass({ type: 'commitVerbosityChanged', value: 'high' });
  shouldPass({ type: 'languageChanged', value: 'ja' });
  shouldPass({ type: 'localModelChanged', value: 'Qwen3-4B-Instruct-2507-Q4_K_M' });
  shouldPass({ type: 'localModelDownload' });
  shouldPass({ type: 'localModelCancelDownload' });
  shouldPass({ type: 'localModelDelete' });
  shouldPass({ type: 'localModelTest' });
  shouldPass({ type: 'localModelRefresh' });
  shouldPass({ type: 'codexLogin' });
  shouldPass({ type: 'codexLogout' });
  shouldPass({ type: 'codexRefresh' });
  shouldFail({});
  shouldFail({ type: 'commitPromptChanged', value: 1 });
  shouldFail({ type: 'commitProviderChanged', value: 'command:evil' });
  shouldFail({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: '12000' } });
  shouldFail({ type: 'commitReasoningChanged', value: 'extreme' });
  shouldFail({ type: 'commitCodexReasoningChanged', value: 'none' });
  shouldFail({ type: 'commitVerbosityChanged', value: 'verbose' });
  shouldFail({ type: 'languageChanged', value: 'xx' });
  shouldFail({ type: 'unknown' });
  console.log('panelMessageGuard.test.ts passed');
}
