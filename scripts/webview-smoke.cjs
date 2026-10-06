const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/* global document, window, getComputedStyle */
// Playwright CLI の実ブラウザー内で、隔離サーバーの本番画面コードを操作する。
module.exports = async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const diagnostics = async () => (await page.request.get(new URL('/diagnostics', page.url()).href)).json();
  const until = async (predicate, label = '画面状態') => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await predicate()) return;
      await page.waitForTimeout(30);
    }
    throw new Error('待機がタイムアウト: ' + label);
  };

  const generate = async () => {
    const before = (await diagnostics()).generations;
    await page.locator('#generate').click();
    await until(async () => {
      const value = await diagnostics();
      return value.state.commitStatus === 'ready' && value.generations > before;
    }, '生成完了');
    await until(async () => await page.locator('#apply').isEnabled() && await page.locator('#generate').isEnabled(), '生成後の操作');
    assert(await page.locator('#result').textContent() === 'chore: 検証用の変更', '生成結果');
  };

  async function verifyMessageBoundary() {
    await until(async () => await page.locator('body').getAttribute('aria-busy') === 'false');
    const before = await page.evaluate(() => ({
      provider: document.getElementById('provider').value,
      prompt: document.getElementById('prompt').value,
      language: document.documentElement.lang
    }));
    await page.evaluate(() => {
      for (const state of [null, undefined, [], 'invalid', 42]) {
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'state', state } }));
      }
    });
    const after = await page.evaluate(() => ({
      provider: document.getElementById('provider').value,
      prompt: document.getElementById('prompt').value,
      language: document.documentElement.lang
    }));
    assert(JSON.stringify(before) === JSON.stringify(after), '不正な状態更新で画面を変更しない');
    const toast = async message => page.evaluate(promptToast => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'state', state: { promptToast } } }));
    }, message);
    const toastVisible = () => page.locator('#promptSaved').evaluate(element => getComputedStyle(element).visibility === 'visible');
    await toast('fixture notification A');
    assert(await toastVisible(), '通知を表示する');
    await page.waitForTimeout(700);
    await toast('fixture notification B');
    await page.waitForTimeout(2000);
    assert(await toastVisible() && await page.locator('#promptSaved').textContent() === 'fixture notification B',
      '先の通知の期限で新しい通知を隠さない');
    await until(async () => !(await toastVisible()), '新しい通知の期限');
    await toast(undefined);
    return { status: 'passed', features: ['malformed state ignored', 'notification replacement and expiry'] };
  }

  async function verifyPanel() {
    await page.locator('#language').selectOption('ja');
    await until(async () => await page.locator('html').getAttribute('lang') === 'ja' &&
      await page.locator('body').getAttribute('aria-busy') === 'false');
    await page.locator('#provider').selectOption('gemini');
    await until(async () => (await diagnostics()).state.commitProvider === 'gemini' &&
      await page.locator('#apiKeyProvider').inputValue() === 'gemini');
    for (const preset of (await diagnostics()).state.promptPresets.filter(p => !p.isDefault)) {
      await page.locator('#promptPreset').selectOption(preset.id);
      await page.locator('#presetDelete').click();
      await until(async () => !(await diagnostics()).state.promptPresets.some(p => p.id === preset.id));
    }
    await page.locator('#includeBinary').check();
    await page.locator('#apiKeyClear').click();
    await until(async () => !(await diagnostics()).state.apiKeys.gemini.ready);
    assert(await page.locator('#generate').isDisabled(), '未保存キーでは生成できない');
    assert(await page.locator('#provider option').count() === 5, '全プロバイダーを選択できる');
    await page.locator('#apiKeyInput').fill('fixture-gemini-browser-key');
    await page.locator('#apiKeySave').click();
    await until(async () => (await diagnostics()).state.apiKeys.gemini.ready);
    assert(await page.locator('#apiKeySave').isDisabled(), '伏せ字を再保存できない');
    await page.locator('#apiKeyInput').fill('browser-updated-key');
    await page.locator('#includeBinary').uncheck();
    await until(async () => !(await diagnostics()).state.commitIncludeBinary);
    assert(await page.locator('#apiKeyInput').inputValue() === 'browser-updated-key', '状態更新後もキーの入力を保つ');
    await page.locator('#apiKeySave').click();
    await until(async () => (await diagnostics()).state.apiKeys.gemini.preview === 'br...-key');
    await generate();
    await page.locator('#apply').click();
    await until(async () => (await diagnostics()).scm[0] === 'chore: 検証用の変更');
    assert(await page.locator('#presetDelete').isDisabled(), 'デフォルトの削除を防ぐ');
    await page.locator('#prompt').fill('ブラウザーからの検証用指示');
    await page.locator('#presetName').fill('ブラウザー検証');
    await page.locator('#presetAdd').click();
    await until(async () => (await diagnostics()).state.promptPresets.length === 2);
    const presetId = (await diagnostics()).state.activePromptPresetId;
    await page.locator('#prompt').fill('更新された検証用指示');
    await page.locator('#presetName').fill('更新済みプリセット');
    await page.locator('#presetAdd').click();
    await until(async () => (await diagnostics()).state.commitPrompt === '更新された検証用指示');
    assert((await diagnostics()).state.activePromptPresetId === presetId, '上書きは同じプリセット');
    await page.locator('#maxPromptMode').selectOption('limited');
    await page.locator('#maxPromptValue').fill('12000');
    await page.locator('#maxPromptValue').blur();
    await until(async () => (await diagnostics()).state.commitMaxPromptChars === 12000);
    await page.locator('#maxPromptValue').fill('0');
    await until(async () => (await diagnostics()).state.commitMaxPromptChars === null);
    await page.locator('#maxPromptMode').selectOption('limited');
    await page.locator('#maxPromptValue').fill('12000');
    await until(async () => (await diagnostics()).state.commitMaxPromptChars === 12000);
    await page.locator('#maxPromptValue').fill('');
    await until(async () => (await diagnostics()).state.commitMaxPromptChars === null);
    await page.locator('#maxPromptMode').selectOption('limited');
    await page.locator('#apiKeyInput').fill('limit-fixture-key');
    await page.locator('#apiKeySave').click();
    await until(async () => (await diagnostics()).state.apiKeys.gemini.preview === 'li...-key' &&
      (await page.locator('#apiKeyPreview').textContent()).includes('li...-key'), '制限の入力中に認証状態を更新');
    assert(await page.locator('#maxPromptValue').isEnabled(), '空欄で制限を選んだ後も入力可能');
    assert(await page.locator('#maxPromptMode').inputValue() === 'limited', '未入力の制限モードを保持');
    await page.locator('#maxPromptValue').fill('12000');
    await until(async () => (await diagnostics()).state.commitMaxPromptChars === 12000);
    await page.locator('#language').selectOption('en');
    await until(async () => await page.locator('html').getAttribute('lang') === 'en' &&
      await page.locator('body').getAttribute('aria-busy') === 'false' &&
      await page.locator('#prompt').inputValue() === '更新された検証用指示');
    assert(await page.locator('#prompt').inputValue() === '更新された検証用指示', '言語切り替えでカスタム指示を保持');
    assert(await page.getByRole('heading', {name:'LLM Settings'}).count() === 1, '静的見出しも切り替える');
    await page.locator('#presetDelete').click();
    await until(async () => (await diagnostics()).state.promptPresets.length === 1);
    await page.screenshot({path:'output/playwright/cloud-generation.png',fullPage:true});
    assert((await diagnostics()).errors.length === 0, '拡張側の例外がない');
    return {status:'passed', features:['key draft/save/clear','Gemini generation','SCM','preset CRUD','prompt limit','language']};
  }

  async function verifyProviders() {
    const choose = async provider => {
      await page.locator('#provider').selectOption(provider);
      await until(async () => (await diagnostics()).state.commitProvider === provider && await page.locator('#apiKeyProvider').inputValue() === provider, provider);
      await page.locator('body').ariaSnapshot();
    };
    await choose('openai');
    await page.locator('#apiKeyInput').fill('fixture-openai-browser-key');
    await page.locator('#apiKeySave').click();
    await until(async () => (await diagnostics()).state.apiKeys.openai.ready, 'OpenAI 保存');
    assert((await page.locator('#reasoning option').evaluateAll(options => options.map(o=>o.value))).includes('max'), '既定モデルに max');
    const recommended = await page.locator('#model').inputValue();
    await page.locator('#model').selectOption('__custom__');
    await page.locator('#includeBinary').check();
    await until(async () => (await diagnostics()).state.commitIncludeBinary);
    assert(await page.locator('#model').inputValue() === '__custom__' && await page.locator('#customModel').isVisible(), '候補と同じモデルでもカスタム欄を保持');
    await page.locator('#customModel').fill('');
    await page.locator('#includeBinary').uncheck();
    await until(async () => !(await diagnostics()).state.commitIncludeBinary);
    assert(await page.locator('#customModel').inputValue() === '', 'カスタム入力途中の空欄を保持');
    await page.locator('#customModel').fill('gpt-5.1-codex-max');
    await until(async () => (await diagnostics()).state.commitModel === 'gpt-5.1-codex-max', 'カスタムモデル');
    assert(JSON.stringify(await page.locator('#verbosity option').evaluateAll(options=>options.map(o=>o.value))) === '["medium"]', '旧 Codex の詳細度を固定');
    await page.locator('#customModel').fill(recommended);
    await until(async () => (await diagnostics()).state.commitModel === recommended);
    assert(await page.locator('#customModel').isVisible(), '候補に一致しても入力欄を閉じない');
    await page.locator('#model').selectOption(recommended);
    await until(async () => !(await page.locator('#customModel').isVisible()));
    await page.locator('#model').selectOption('__custom__');
    await page.locator('#customModel').fill('custom-model');
    await until(async () => (await diagnostics()).state.commitModel === 'custom-model', '任意モデル');
    await page.locator('#reasoning').selectOption('low');
    await page.locator('#verbosity').selectOption('high');
    await generate();
    await choose('claude');
    await page.locator('#apiKeyInput').fill('fixture-claude-browser-key');
    await page.locator('#apiKeySave').click();
    await until(async () => (await diagnostics()).state.apiKeys.claude.ready, 'Claude 保存');
    await generate();
    await choose('codex');
    assert(await page.locator('#generate').isDisabled(), 'Codex 未ログイン');
    await page.locator('#codexAuthLogin').click();
    await until(async () => (await diagnostics()).state.apiKeys.codex.ready, 'Codex ログイン');
    await page.locator('#reasoning').selectOption('xhigh');
    await generate();
    await page.locator('#codexAuthRefresh').click();
    await page.locator('#codexAuthLogout').click();
    await until(async () => !(await diagnostics()).state.apiKeys.codex.ready, 'Codex ログアウト');
    assert(await page.locator('#generate').isDisabled(), 'ログアウト後は生成不可');
    await choose('local');
    assert(await page.locator('#generate').isDisabled(), 'Local 未ダウンロード');
    const choices = await page.locator('#localModelName option').evaluateAll(options=>options.map(o=>o.value));
    assert(choices.length === 4, 'Local の4モデル');
    const cards=[];
    for (const model of choices) {
      await page.locator('#localModelName').selectOption(model);
      await until(async () => (await diagnostics()).state.localModel.id === model && (await diagnostics()).state.localModel.status === 'notDownloaded', 'Local 選択');
      const box=await page.locator('#localModelGuidance').boundingBox();
      assert(box.height === 122, 'モデルカードの高さを保持');
      assert((await page.locator('#localModelGuidanceDetails').textContent()).includes('Q4_K_M'), 'モデル別詳細');
      cards.push({model,height:box.height});
    }
    await page.locator('#localModelName').selectOption(choices[0]);
    await until(async () => (await diagnostics()).state.localModel.id === choices[0], '既定 Local');
    await page.locator('#localModelDownload').click();
    await until(async () => (await diagnostics()).state.localModel.status === 'downloading', '転送開始');
    await page.locator('#localModelCancel').click();
    await until(async () => (await diagnostics()).state.localModel.status === 'notDownloaded', '転送中止');
    await page.locator('#localModelDownload').click();
    await until(async () => (await diagnostics()).state.localModel.status === 'ready', '転送完了');
    await page.request.post(new URL('/local-test/hold', page.url()).href);
    try {
      await page.locator('#localModelTest').click();
      await until(async () => await page.locator('#localModelTest').isDisabled(), '接続確認の開始');
      const controls = await page.evaluate(() =>
        ['model', 'localModelName', 'localModelDelete', 'localModelDownload', 'generate']
          .map(id => ({ id, disabled: document.getElementById(id)?.disabled === true })));
      for (const control of controls) assert(control.disabled, '接続確認中の '+control.id+' を無効化');
    } finally {
      await page.request.post(new URL('/local-test/release', page.url()).href);
    }
    await until(async () => (await diagnostics()).state.localModel.status === 'ready', '接続確認');
    await generate();
    await page.screenshot({path:'output/playwright/local-ready.png',fullPage:true});
    await page.locator('#localModelDelete').click();
    await until(async () => (await diagnostics()).state.localModel.status === 'notDownloaded', 'モデル削除');
    assert((await diagnostics()).errors.length === 0, '拡張例外なし');
    return {status:'passed', features:['OpenAI','Claude','custom model','reasoning/verbosity','Codex login/generate/logout','Local download/cancel/test/generate/delete'],cards};
  }

  async function verifyGenerationFailures() {
    const results=[];
    for (const [provider, reason] of [
      ['openai','max_output_tokens'], ['gemini','MAX_TOKENS'], ['claude','max_tokens'], ['local','length']
    ]) {
      await page.locator('#provider').selectOption(provider);
      await until(async () => (await diagnostics()).state.commitProvider === provider &&
        await page.locator('#apiKeyProvider').inputValue() === provider, provider);
      if (provider === 'local') {
        await page.locator('#localModelDownload').click();
        await until(async () => (await diagnostics()).state.localModel.status === 'ready', 'Local準備');
      }
      await page.locator('#prompt').fill('normal fixture');
      await until(async () => (await diagnostics()).state.commitPrompt === 'normal fixture');
      await generate();
      const previousScm = (await diagnostics()).scm;
      const prompt = provider === 'local' ? 'INCOMPLETE_LOCAL_FIXTURE' : 'INCOMPLETE_FIXTURE';
      await page.locator('#prompt').fill(prompt);
      await until(async () => (await diagnostics()).state.commitPrompt === prompt);
      await page.locator('#generate').click();
      await until(async () => (await diagnostics()).state.commitStatus === 'error', '未完成応答');
      await until(async () => await page.locator('#apply').isDisabled(), '未完成結果の反映無効');
      await until(async () => (await page.locator('#errorBox').textContent()).includes(reason), '失敗理由');
      const state = await diagnostics();
      assert(!state.state.commitResult, provider+'の部分文章を結果へ渡さない');
      assert((await page.locator('#result').textContent()) !== 'chore: 検証用の変更', '前回の表示結果を消す');
      assert(JSON.stringify(state.scm) === JSON.stringify(previousScm), provider+'のSCMを保持');
      await page.locator('#prompt').fill('normal fixture');
      await until(async () => (await diagnostics()).state.commitPrompt === 'normal fixture');
      await generate();
      await until(async () => !(await page.locator('#errorBox').isVisible()), '正常復旧後のエラー消去');
      results.push({provider,reason,status:'passed',partialRejected:true,scmPreserved:true,
        resultCleared:true,applyDisabled:true,normalRecovered:true,errorCleared:true});
    }
    await page.screenshot({path:'output/playwright/incomplete-protection.png',fullPage:true});
    await page.locator('#localModelDelete').click();
    await until(async () => (await diagnostics()).state.localModel.status === 'notDownloaded', 'Local削除');
    assert((await diagnostics()).errors.length === 0, '拡張側の例外なし');
    return {status:'passed',results};
  }

  async function verifyLocalizedLayout() {
    const languages = await page.locator('#language option').evaluateAll(options=>options.map(o=>o.value));
    const models = await page.locator('#localModelName option').evaluateAll(options=>options.map(o=>o.value));
    assert(languages.length === 32 && models.length === 4, '言語とモデルの登録数');
    const results=[];
    for (const language of languages) {
      await page.locator('#language').selectOption(language);
      await until(async () => await page.locator('html').getAttribute('lang') === language &&
        await page.locator('body').getAttribute('aria-busy') === 'false', language);
      await page.locator('body').ariaSnapshot();
      for (const width of [320,480,1280]) {
        await page.setViewportSize({width,height:960});
        for (const model of models) {
          await page.locator('#localModelName').selectOption(model);
          await until(async () => (await diagnostics()).state.localModel.id === model, model);
          const box = await page.locator('#localModelGuidance').boundingBox();
          const layout = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
            ids:[...document.querySelectorAll('[id]')].map(e=>e.id)}));
          assert(box.height === 122, language+' '+model+': 高さ');
          assert(layout.scroll <= layout.viewport, language+' '+width+': 横方向のはみ出し');
          assert(new Set(layout.ids).size === layout.ids.length, language+': ID 重複');
          results.push({language,width,model,height:box.height,overflow:false});
        }
        if (['ja','en','ar','nl'].includes(language) && [320,1280].includes(width)) {
          await page.screenshot({path:`output/playwright/layout-${language}-${width}.png`,fullPage:true});
        }
      }
    }
    await page.locator('#language').selectOption('ja');
    await until(async () => await page.locator('html').getAttribute('lang') === 'ja', '日本語へ復帰');
    await page.setViewportSize({width:480,height:960});
    assert((await diagnostics()).errors.length === 0, '拡張側例外なし');
    return {status:'passed',languages:languages.length,models:models.length,widths:[320,480,1280],cases:results.length};
  }
  const results = [];
  for (const verify of [verifyMessageBoundary, verifyPanel, verifyProviders, verifyGenerationFailures, verifyLocalizedLayout]) results.push(await verify());
  if (errors.length) throw new Error(errors.join("\n"));
  return {status:"passed", results, browserErrors:errors};
};

if (require.main === module) {
  const url = new URL(process.argv[2]);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('隔離サーバーの localhost URL を指定してください');
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['--yes', '--package', '@playwright/cli', 'playwright-cli', '-s=commit-maker-smoke'];
  const cli = (...input) => execFileSync(command, [...args, ...input], { encoding:'utf8', maxBuffer:8*1024*1024 });
  fs.mkdirSync(path.join('output', 'playwright'), {recursive:true});
  try {
    console.log(cli('open', url.href, '--headed'));
    cli('snapshot');
    const result = cli('run-code', module.exports.toString());
    fs.writeFileSync(path.join('output', 'playwright', 'verification.log'), result);
    const match = /### Result\n([^\n]+)/.exec(result);
    const verification = match && JSON.parse(match[1]);
    if (verification?.status !== 'passed') throw new Error('ブラウザー検証が成功結果を返しませんでした');
    fs.writeFileSync(path.join('output', 'playwright', 'verification.json'), JSON.stringify(verification, null, 2));
    console.log(JSON.stringify(verification, null, 2));
    console.log(cli('console', 'error'));
  } catch (error) {
    console.error(error.stdout || String(error));
    process.exitCode = 1;
  } finally { cli('close'); }
}
