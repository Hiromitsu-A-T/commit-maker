const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

// 専用プロファイル・一時 Git・fixture CLI で、利用者の設定や認証を使わず検証する。
const workspace = path.resolve(__dirname, '..');
const code = process.argv[2] || (process.platform === 'darwin'
  ? '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
  : 'code');
const vsix = process.argv[3] && path.resolve(process.argv[3]);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-maker-vscode-'));
const resultPath = path.join(workspace, 'output', 'native-vscode.json');
const env = { ...process.env, COMMIT_MAKER_SMOKE_ROOT: root, COMMIT_MAKER_SMOKE_RESULT: resultPath };
// 既存の VS Code への転送と、環境変数経由の実 API 認証を防ぐ。
delete env.VSCODE_IPC_HOOK_CLI;
for (const key of ['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key',
  'COMMIT_MAKER_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key',
  'COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'anthropic_api_key']) delete env[key];

const run = (command, args, cwd = workspace) => execFileSync(command, args, {
  cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024
});
const profileArgs = ['--user-data-dir', path.join(root, 'user-data'), '--extensions-dir', path.join(root, 'extensions')];
const quote = value => "'" + value.replace(/'/g, "'\\''") + "'";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;
let childExit;
let launchError;

// CLI の --wait マーカーではなく、Extension Host が書く検証結果を待つ。
async function waitForResult() {
  const started = Date.now();
  while (!fs.existsSync(resultPath)) {
    if (launchError) throw launchError;
    if (child.exitCode !== null && child.exitCode !== 0) throw new Error('VS Code の起動に失敗しました');
    if (Date.now() - started > 120000) throw new Error('Extension Host の検証が時間内に完了しませんでした');
    await pause(100);
  }
  return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
}

async function closeOwnedProcesses() {
  // 作成した profile のパスを持つプロセスだけを対象にする。
  const list = () => execFileSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).split('\n')
    .filter(line => line.includes(root) && line.includes('--user-data-dir'))
    .map(line => Number(line.trim().split(/\s+/, 1)[0]));
  // macOS ではウィンドウを閉じた後も本体の終了に時間がかかる。
  const waitForExit = async () => {
    const deadline = Date.now() + 10000;
    while (list().length && Date.now() < deadline) await pause(100);
  };
  await waitForExit();
  for (const pid of list()) {
    try { process.kill(pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  if (childExit) await childExit;
  await waitForExit();
  assert.deepStrictEqual(list(), [], '専用 VS Code プロセスを終了する');
}

async function main() {
  let result;
  try {
    assert.notStrictEqual(process.platform, 'win32', 'この fixture CLI は macOS / Linux 用です');
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.rmSync(resultPath, { force: true });
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const git = (...args) => run('git', ['-c', 'core.hooksPath=' + path.join(root, 'disabled-hooks'), ...args], repo);
    git('init', '-b', 'main');
    git('config', 'user.name', 'Commit Maker fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    fs.writeFileSync(path.join(repo, 'sample.txt'), 'before\n');
    git('add', 'sample.txt');
    git('-c', 'commit.gpgSign=false', 'commit', '-m', 'chore: fixture');
    fs.writeFileSync(path.join(repo, 'sample.txt'), 'after\n');

    const cliScript = path.join(root, 'codex-fixture.cjs');
    fs.writeFileSync(cliScript, `const fs = require('fs');
  const args = process.argv.slice(2);
  if (args[0] === '--version') console.log('codex fixture');
  else if (args[0] === 'login') console.log('Logged in using fixture');
  else if (args[0] === 'exec') {
    process.stdin.resume();
    process.stdin.on('end', () => fs.writeFileSync(args[args.indexOf('--output-last-message') + 1],
      JSON.stringify({message:'chore: 実VS Codeの検証'})));
  } else process.exitCode = 1;
  `);
    fs.writeFileSync(path.join(root, 'codex-fixture'), `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(cliScript)} "$@"\n`, { mode: 0o755 });

    let extensionPath = workspace;
    if (vsix) {
      console.log(run(code, [...profileArgs, '--install-extension', vsix, '--force']));
      const extensions = fs.readdirSync(path.join(root, 'extensions'));
      const installed = extensions.find(name => name.toLowerCase().startsWith('hiromitsu.commit-maker-'));
      assert.ok(installed, 'VSIX のインストール先が存在する');
      extensionPath = path.join(root, 'extensions', installed);
    }
    child = spawn(code, [...profileArgs, '--extensionDevelopmentPath=' + extensionPath,
      '--extensionTestsPath=' + path.join(__dirname, 'vscode-smoke.cjs'), '--disable-workspace-trust',
      '--skip-welcome', '--skip-release-notes', '--new-window', repo], {
      cwd: workspace, env, detached: true, stdio: 'inherit'
    });
    childExit = new Promise(resolve => {
      child.once('exit', resolve);
      child.once('error', error => { launchError = error; resolve(); });
    });
    result = await waitForResult();
    assert.strictEqual(result.status, 'passed');
    result.source = vsix ? 'VSIX' : 'workspace';
  } finally {
    await closeOwnedProcesses();
    fs.rmSync(root, { recursive: true, force: true });
  }
  result.cleanup = 'passed';
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
