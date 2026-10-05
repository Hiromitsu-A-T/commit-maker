import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { createHarness, waitUntil } from './test-support';
import { collectDiff } from '../src/services/diffCollector';
import { callLocalLlm, stopLocalLlmRuntime } from '../src/services/llm/local';
import { LOCAL_MODEL_DEFINITIONS } from '../src/constants';
import { getLocalModelDefinition, getLocalModelPath } from '../src/services/localModel';
import type * as vscode from 'vscode';

async function main(): Promise<void> {
  const app = await createHarness({ model: 'custom-model' });
  assert.strictEqual(app.state.commitModel, 'custom-model', '明示したカスタムモデルを既定値へ戻さない');
  let disposed = false;
  const generate = () => app.send({ type: 'commitGenerate', value: { includeUnstaged: true, includeUntracked: true, includeBinary: false } });
  try {
    generate();
    await waitUntil(() => app.state.commitStatus === 'error');
    assert.match(app.state.commitLastError ?? '', /API/);
    assert.strictEqual(app.requests.length, 0);
    for (const provider of ['gemini', 'openai', 'claude'] as const) {
      app.send({ type: 'submitApiKey', provider, value: `fixture-${provider}-key` });
      await waitUntil(() => app.state.apiKeys[provider].ready);
      app.send({ type: 'commitProviderChanged', value: provider });
      generate();
      await waitUntil(() => app.state.commitStatus === 'ready');
      assert.strictEqual(app.state.commitResult, 'chore: 検証用の変更');
      const request = app.requests.at(-1)!;
      assert.match(JSON.stringify(request.body), /sample.txt/);
      assert.ok(!JSON.stringify(app.state).includes(`fixture-${provider}-key`), '画面へ完全なキーを渡さない');
    }
    app.send({ type: 'commitApply' });
    await waitUntil(() => app.repos[0].inputBox.value === 'chore: 検証用の変更');
    assert.strictEqual(app.repos[0].git('log', '--format=%s', '-1').trim(), 'chore: fixture', 'SCM への反映だけでコミットしない');
    const reads = app.secretReads.count;
    app.secretReads.delayMs = 60;
    app.send({ type: 'codexRefresh' });
    await waitUntil(() => app.secretReads.count > reads);
    app.secretReads.delayMs = 0;
    app.send({ type: 'submitApiKey', provider: 'openai', value: 'updated-fixture-key' });
    await waitUntil(() => app.state.apiKeys.openai.preview === 'up...-key');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.strictEqual(app.state.apiKeys.openai.preview, 'up...-key', '古い認証確認で保存後の状態を上書きしない');
    app.input.provider = 'claude'; app.input.value = 'command-fixture-key';
    await app.commands.get('commitMaker.saveApiKey')!();
    assert.strictEqual(app.state.apiKeys.claude.preview, 'co...-key', 'コマンドで保存したキーも画面に反映する');
    console.log('PASS: クラウド3種の認証・生成契約・SCM反映');

    const before = app.state.commitProvider;
    app.send({ type: 'commitProviderChanged', value: 'invalid' });
    assert.strictEqual(app.state.commitProvider, before);
    app.send({ type: 'openExternal', url: 'https://attacker.example/' });
    assert.deepStrictEqual(app.externalUrls, []);
    app.send({ type: 'openExternal', url: 'https://platform.openai.com/api-keys' });
    assert.deepStrictEqual(app.externalUrls, ['https://platform.openai.com/api-keys']);
    const originalPreset = app.state.activePromptPresetId;
    app.send({ type: 'deletePromptPreset', id: originalPreset });
    assert.strictEqual(app.state.activePromptPresetId, originalPreset);
    app.send({ type: 'savePromptPreset', title: '検証プリセット', body: '検証用の指示' });
    await waitUntil(() => app.state.promptPresets.length === 2);
    const customId = app.state.activePromptPresetId;
    app.send({ type: 'savePromptPreset', title: '更新済み', body: '更新済みの指示' });
    await waitUntil(() => app.state.commitPrompt === '更新済みの指示');
    assert.strictEqual(app.state.activePromptPresetId, customId);
    app.send({ type: 'applyPromptPreset', id: originalPreset });
    await waitUntil(() => app.state.activePromptPresetId === originalPreset);
    app.send({ type: 'applyPromptPreset', id: customId });
    await waitUntil(() => app.state.activePromptPresetId === customId);
    app.send({ type: 'languageChanged', value: 'en' });
    app.send({ type: 'ready' });
    assert.strictEqual(app.state.language, 'en');
    assert.strictEqual(app.state.commitPrompt, '更新済みの指示');
    assert.ok(app.webview.html.includes('<html lang="en">'));
    assert.ok(app.webview.html.includes('/media/ui/elements.js'));
    app.send({ type: 'deletePromptPreset', id: customId });
    await waitUntil(() => app.state.promptPresets.length === 1);
    app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 12000.8 } });
    app.send({ type: 'commitIncludeBinaryChanged', value: false });
    assert.strictEqual(app.state.commitMaxPromptChars, 12000);
    for (const value of [0, null]) {
      app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 1 } });
      app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value } });
      assert.strictEqual(app.state.commitMaxPromptChars, null, '0 / 空欄で保存済みの上限を解除する');
      assert.strictEqual(app.state.commitMaxPromptMode, 'limited');
      generate();
      await waitUntil(() => app.state.commitStatus === 'ready');
      assert.match(JSON.stringify(app.requests.at(-1)!.body), /sample.txt/, '0 / 空欄で差分の上限が解除される');
      app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 12000 } });
    }
    console.log('PASS: 入力境界・リンク許可・プリセットCRUD・言語・差分設定');

    const cwd = app.repos[0].rootUri.fsPath;
    await fs.promises.mkdir(path.join(cwd, '新しいディレクトリー'));
    await fs.promises.writeFile(path.join(cwd, '..memo.txt'), 'inside-dot-dot-prefix');
    await fs.promises.writeFile(path.join(cwd, '新しいディレクトリー', ' spaced name .txt'), 'unicode-untracked-fixture');
    app.send({ type: 'commitProviderChanged', value: 'gemini' });
    generate();
    await waitUntil(() => app.state.commitStatus === 'ready');
    assert.match(JSON.stringify(app.requests.at(-1)?.body), /unicode-untracked-fixture/);
    assert.match(JSON.stringify(app.requests.at(-1)?.body), / spaced name .txt/);
    assert.match(JSON.stringify(app.requests.at(-1)?.body), /inside-dot-dot-prefix/);
    await fs.promises.writeFile(path.join(cwd, 'staged.txt'), 'staged fixture');
    app.repos[0].git('add', 'staged.txt');
    const partialApiRepo = { ...app.repos[0], diffIndexWithHEAD: async () => { throw new Error('API fixture failure'); } };
    const partialDiff = await collectDiff(partialApiRepo, { includeUnstaged: true, includeUntracked: false, includeBinary: false });
    assert.match(partialDiff, /staged fixture/);
    assert.match(partialDiff, /sample.txt/);
    const listApiDiff = await collectDiff({ ...app.repos[0], diffIndexWithHEAD: async () => [], diffWithHEAD: async () => [] },
      { includeUnstaged: true, includeUntracked: false, includeBinary: false });
    assert.match(listApiDiff, /staged fixture/);
    assert.match(listApiDiff, /sample.txt/);
    const largeFile = path.join(cwd, 'large-cli.txt');
    await fs.promises.writeFile(largeFile, 'A'.repeat(5 * 1024 * 1024) + 'CLI-large-end');
    app.repos[0].git('add', 'large-cli.txt');
    const cliDiff = await collectDiff({ rootUri: app.repos[0].rootUri },
      { includeUnstaged: false, includeUntracked: false, includeBinary: false });
    assert.match(cliDiff, /CLI-large-end/, '従来の4MiB buffer を超える差分も収集上限まで保持する');
    app.repos[0].git('reset', '--quiet', '--', 'large-cli.txt');
    await fs.promises.unlink(largeFile);
    console.log('PASS: 実Gitと未追跡ディレクトリー・非ASCII・空白パス');

    const originalDiff = app.repos[0].diffIndexWithHEAD;
    let releaseDiff: (() => void) | undefined;
    app.repos[0].diffIndexWithHEAD = async () => {
      await new Promise<void>(resolve => { releaseDiff = resolve; });
      return originalDiff();
    };
    try {
      app.send({ type: 'languageChanged', value: 'ja' });
      app.send({ type: 'ready' });
      app.send({ type: 'commitPromptChanged', value: 'SNAPSHOT_ORIGINAL' });
      generate();
      await waitUntil(() => Boolean(releaseDiff));
      app.send({ type: 'languageChanged', value: 'en' });
      app.send({ type: 'ready' });
      app.send({ type: 'commitPromptChanged', value: 'SNAPSHOT_CHANGED' });
      app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 1 } });
      releaseDiff!();
      await waitUntil(() => app.state.commitStatus === 'ready');
      const generatedBody = JSON.stringify(app.requests.at(-1)!.body);
      assert.match(generatedBody, /SNAPSHOT_ORIGINAL/);
      assert.ok(!generatedBody.includes('SNAPSHOT_CHANGED'));
      assert.match(generatedBody, /ja \/ Japanese/);
      assert.match(generatedBody, /sample.txt/, '開始時の文字数制限を使う');
      app.send({ type: 'commitMaxPromptChanged', value: { mode: 'limited', value: 12000 } });
      releaseDiff = undefined;
      const requestCount = app.requests.length;
      generate();
      await waitUntil(() => Boolean(releaseDiff));
      app.send({ type: 'commitProviderChanged', value: 'claude' });
      releaseDiff!();
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.strictEqual(app.requests.length, requestCount, '切替後の接続先へ進行中の差分を送らない');
      assert.strictEqual(app.state.commitStatus, 'error');
    } finally {
      app.repos[0].diffIndexWithHEAD = originalDiff;
      releaseDiff?.();
    }
    const readsBeforeModelChange = app.secretReads.count;
    const requestsBeforeModelChange = app.requests.length;
    app.secretReads.delayMs = 60;
    generate();
    await waitUntil(() => app.secretReads.count > readsBeforeModelChange);
    app.send({ type: 'commitCustomModelChanged', value: 'custom-after-start' });
    app.secretReads.delayMs = 0;
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.strictEqual(app.requests.length, requestsBeforeModelChange, 'モデル切替時は認証待ちの生成も中止する');
    app.send({ type: 'commitPromptChanged', value: 'normal fixture' });
    console.log('PASS: 生成開始時の設定保持・provider / model 切替時の中止');

    app.send({ type: 'codexLogin' });
    await waitUntil(() => app.state.apiKeys.codex.ready);
    assert.ok(app.terminals[0].options.env?.CODEX_HOME?.startsWith(app.root));
    assert.match(app.terminals[0].command || '', /cli_auth_credentials_store/);
    app.send({ type: 'commitProviderChanged', value: 'codex' });
    generate();
    await waitUntil(() => app.state.commitStatus === 'ready');
    assert.strictEqual(app.state.commitResult, 'chore: 検証用の変更');
    app.send({ type: 'codexLogout' });
    await waitUntil(() => !app.state.apiKeys.codex.ready);
    console.log('PASS: 専用Codex認証領域・実CLI起動・生成・ログアウト');

    app.send({ type: 'commitProviderChanged', value: 'local' });
    app.send({ type: 'localModelDownload' });
    await waitUntil(() => app.state.localModel.status === 'downloading' && (app.state.localModel.downloadedBytes ?? 0) > 0);
    app.send({ type: 'localModelCancelDownload' });
    await waitUntil(() => app.state.localModel.status === 'notDownloaded');
    app.send({ type: 'localModelDownload' });
    await waitUntil(() => app.state.localModel.status === 'ready');
    const downloadedModelPath = app.state.localModel.path;
    assert.ok(downloadedModelPath, '取得済みモデルの保存先が画面状態に含まれる');
    assert.ok(fs.existsSync(downloadedModelPath));
    const runtimePath = app.user.get('localRuntimePath');
    assert.ok(typeof runtimePath === 'string');
    const localCall = () => callLocalLlm({ prompt: 'fixture', modelPath: downloadedModelPath,
      runtimePath, extensionUri: app.context.extensionUri as vscode.Uri,
      timeoutMs: 3000, keepAliveMs: 0 });
    assert.deepStrictEqual(await Promise.all([localCall(), localCall()]), ['chore: 検証用の変更', 'chore: 検証用の変更']);
    await assert.rejects(() => callLocalLlm({ prompt: 'EMPTY_LOCAL_FIXTURE', modelPath: downloadedModelPath,
      runtimePath, extensionUri: app.context.extensionUri as vscode.Uri,
      timeoutMs: 3000, keepAliveMs: 0 }), /空|empty/i);
    const pidsFile = path.join(app.root, 'local-pids.txt');
    assert.strictEqual((await fs.promises.readFile(pidsFile, 'utf8')).trim().split('\n').length, 1, '並行呼び出しでも runtime は1個だけ起動する');
    stopLocalLlmRuntime();
    const localModels = LOCAL_MODEL_DEFINITIONS.map(model => model.id);
    for (const id of localModels.slice(1, 3)) {
      const definition = getLocalModelDefinition(app.config as vscode.WorkspaceConfiguration, id);
      const destination = getLocalModelPath(app.context as unknown as vscode.ExtensionContext, definition);
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.copyFile(downloadedModelPath, destination);
    }
    const originalStat = fs.promises.stat;
    let releaseStat: (() => void) | undefined;
    let paused = false;
    fs.promises.stat = ((...args: Parameters<typeof originalStat>) => {
      const result = originalStat(...args);
      if (!paused && String(args[0]).startsWith(path.join(app.root, 'storage'))) {
        paused = true;
        return result.then(value => new Promise(resolve => { releaseStat = () => resolve(value); }));
      }
      return result;
    }) as typeof originalStat;
    try {
      app.send({ type: 'localModelChanged', value: localModels[1] });
      await waitUntil(() => Boolean(releaseStat));
      app.send({ type: 'localModelChanged', value: localModels[2] });
      await waitUntil(() => app.state.localModel.id === localModels[2] && app.state.localModel.status === 'ready');
      releaseStat!();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert.strictEqual(app.state.localModel.id, localModels[2], '遅い検査で前のモデルを再表示しない');
    } finally {
      fs.promises.stat = originalStat;
      releaseStat?.();
    }
    app.send({ type: 'localModelTest' });
    assert.strictEqual(app.state.localModel.status, 'loading');
    app.send({ type: 'commitModelChanged', value: localModels[1] });
    assert.strictEqual(app.state.localModel.id, localModels[2], '接続確認中は別のモデルへ切り替えない');
    await waitUntil(() => app.state.localModel.status === 'ready');
    generate();
    await waitUntil(() => app.state.commitStatus === 'ready');
    assert.strictEqual(app.state.commitResult, 'chore: 検証用の変更');
    const originalRm = fs.promises.rm;
    let releaseDelete: (() => void) | undefined;
    fs.promises.rm = (async (...args: Parameters<typeof originalRm>) => {
      if (String(args[0]) === app.state.localModel.path) {
        await new Promise<void>(resolve => { releaseDelete = resolve; });
      }
      return originalRm(...args);
    }) as typeof originalRm;
    try {
      app.send({ type: 'localModelDelete' });
      await waitUntil(() => Boolean(releaseDelete));
      assert.strictEqual(app.state.localModel.status, 'loading');
      app.send({ type: 'localModelChanged', value: localModels[1] });
      app.send({ type: 'localModelDownload' });
      generate();
      assert.strictEqual(app.state.localModel.id, localModels[2], '削除中のモデル操作を重ねない');
      assert.strictEqual(app.state.commitStatus, 'ready', '削除中は新しい生成を始めない');
      releaseDelete!();
    } finally {
      fs.promises.rm = originalRm;
      releaseDelete?.();
    }
    await waitUntil(() => app.state.localModel.status === 'notDownloaded');
    console.log('PASS: Local転送・SHA256・実HTTP runtime・接続確認・生成・削除');

    app.send({ type: 'commitProviderChanged', value: 'gemini' });
    app.send({ type: 'commitPromptChanged', value: 'FAIL_FIXTURE' });
    generate();
    await waitUntil(() => app.state.commitStatus === 'error');
    assert.match(app.state.commitLastError ?? '', /400/);
    app.send({ type: 'commitPromptChanged', value: 'SLOW_FIXTURE' });
    app.repos[0].inputBox.value = 'existing-message';
    const old = app.commands.get('commitMaker.generateCommitFromSCM')!(app.repos[0]);
    await waitUntil(() => JSON.stringify(app.requests.at(-1)?.body).includes('SLOW_FIXTURE'));
    app.send({ type: 'commitPromptChanged', value: 'normal fixture' });
    const next = app.commands.get('commitMaker.generateCommitFromSCM')!(app.repos[1]);
    await Promise.all([old, next]);
    assert.strictEqual(app.repos[0].inputBox.value, 'existing-message', '古い呼び出しは新しい結果を別リポジトリーに書かない');
    assert.strictEqual(app.repos[1].inputBox.value, 'chore: 検証用の変更');
    app.send({ type: 'commitPromptChanged', value: 'SLOW_FIXTURE' });
    generate();
    await app.commands.get('commitMaker.cancelCommitFromSCM')!();
    assert.strictEqual(app.state.commitStatus, 'error');
    assert.strictEqual(app.contexts.get('commitMaker.commitGenerating'), false);
    console.log('PASS: エラー復旧・キャンセル・同時生成時のSCM所有権');
    const localPids = (await fs.promises.readFile(path.join(app.root, 'local-pids.txt'), 'utf8')).trim().split('\n').map(Number);
    app.send({ type: 'savePromptPreset', title: '終了前の検査', body: '終了後に通知しない' });
    await waitUntil(() => Boolean(app.state.promptToast));
    await app.dispose();
    disposed = true;
    const finalState = app.state;
    await new Promise(resolve => setTimeout(resolve, 2700));
    assert.strictEqual(app.state, finalState, '終了後に toast timer が画面へ状態を送らない');
    await waitUntil(() => localPids.every(pid => { try { process.kill(pid, 0); return false; } catch { return true; } }));
    assert.ok(app.emitters.every(emitter => emitter.disposed), '全イベント通知を破棄する');
    assert.deepStrictEqual(app.errors, []);
    console.log('PASS: 拡張終了時のイベント・プロセス・認証・設定の隔離');
  } finally {
    if (!disposed) await app.dispose();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
