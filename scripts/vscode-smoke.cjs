const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

/** 専用 user-data-dir と一時 Git リポジトリーで実行する Extension Host 検証。 */
exports.run = async function () {
  const resultPath = process.env.COMMIT_MAKER_SMOKE_RESULT;
  let panelState = {};
  let restorePanel;
  try {
    assert.ok(resultPath && process.env.COMMIT_MAKER_SMOKE_ROOT, '隔離領域の指定が必要');
    const root = process.env.COMMIT_MAKER_SMOKE_ROOT;
    const cliPath = path.join(root, 'codex-fixture');
    await vscode.workspace.getConfiguration('commitMaker').update('provider', 'codex', vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration('commitMaker').update('codexCommand', cliPath, vscode.ConfigurationTarget.Global);
    const extension = vscode.extensions.getExtension('Hiromitsu.commit-maker');
    assert.ok(extension, '拡張が検出される');
    const Panel = require(path.join(extension.extensionPath, 'out/panel.js')).CommitPanelProvider;
    const originalUpdate = Panel.prototype.updateState;
    Panel.prototype.updateState = function (state) { panelState = {...panelState, ...state}; return originalUpdate.call(this, state); };
    restorePanel = () => { Panel.prototype.updateState = originalUpdate; };
    await extension.activate();
    const git = vscode.extensions.getExtension('vscode.git');
    await git.activate();
    const api = git.exports.getAPI(1);
    for (let attempt = 0; attempt < 100 && !api.repositories.length; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const repo = api.repositories.find(value => value.rootUri.fsPath === path.join(root, 'repo'));
    assert.ok(repo, '一時リポジトリーを標準 Git 拡張が認識する');
    await vscode.commands.executeCommand('commitMaker.showPanel');
    await vscode.commands.executeCommand('commitMaker.generateCommitFromSCM', repo);
    assert.strictEqual(repo.inputBox.value, 'chore: 実VS Codeの検証', '実 SCM 入力欄に生成結果を反映する');
    fs.writeFileSync(resultPath, JSON.stringify({status:'passed', vscode:vscode.version, scm:repo.inputBox.value}, null, 2));
  } catch (error) {
    if (resultPath) fs.writeFileSync(resultPath, JSON.stringify({status:'failed', error:String(error), provider:panelState.commitProvider, model:panelState.commitModel, generationError:panelState.commitLastError}, null, 2));
    throw error;
  } finally {
    restorePanel?.();
    await vscode.commands.executeCommand('workbench.action.closeWindow');
  }
};
