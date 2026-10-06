import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import type * as vscode from 'vscode';
import type { CommitPanelProvider } from '../src/panel';
import type { WebviewOutboundMessage } from '../src/panelMessages';

/** 実装の境界で VS Code とクラウドを置き換え、Git・ファイル・子プロセスは隔離領域で動かす。 */
export async function createHarness(initialSettings: Record<string, unknown> = {}) {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-integration-'));
  const packageJson = require('../package.json');
  const values = new Map<string, unknown>();
  for (const [key, property] of Object.entries(packageJson.contributes.configuration.properties)) {
    values.set(key.replace('commitMaker.', ''), (property as { default: unknown }).default);
  }
  const user = new Map<string, unknown>([
    ['endpoint', 'https://fixture.example/v1/responses'],
    ['endpointGemini', 'https://fixture.example/gemini/models'],
    ['endpointClaude', 'https://fixture.example/claude/messages'],
    ['requestTimeoutMs', 1000],
    ...Object.entries(initialSettings)
  ]);
  const config = {
    get: <T>(key: string, fallback?: T): T => (user.has(key) ? user.get(key) : values.get(key) ?? fallback) as T,
    inspect: (key: string) => ({ defaultValue: values.get(key), globalValue: user.get(key) })
  };
  const errors: unknown[] = [];
  const emitters: Emitter<unknown>[] = [];
  class Emitter<T> {
    private listeners = new Set<(value: T) => unknown>();
    disposed = false;
    constructor() { emitters.push(this as Emitter<unknown>); }
    event = (listener: (value: T) => unknown) => {
      this.listeners.add(listener);
      return { dispose: () => this.listeners.delete(listener) };
    };
    fire(value: T): void {
      for (const listener of this.listeners) {
        Promise.resolve(listener(value)).catch(error => errors.push(error));
      }
    }
    dispose(): void { this.disposed = true; this.listeners.clear(); }
  }
  class Uri {
    scheme: string;
    fsPath: string;
    constructor(value: string, scheme = 'file') { this.fsPath = value; this.scheme = scheme; }
    static file(value: string) { return new Uri(value); }
    static parse(value: string) { return new Uri(value, new URL(value).protocol.slice(0, -1)); }
    static joinPath(base: Uri, ...parts: string[]) { return Uri.file(path.join(base.fsPath, ...parts)); }
    toString() { return this.scheme === 'file' ? `file://${this.fsPath}` : this.fsPath; }
  }
  function memento() {
    const data = new Map<string, unknown>();
    return {
      get: <T>(key: string, fallback?: T): T | undefined => (data.has(key) ? data.get(key) : fallback) as T | undefined,
      update: async (key: string, value: unknown) => { data.set(key, value); }
    };
  }
  const secrets = new Map<string, string>();
  const secretReads = { delayMs: 0, count: 0 };
  const storage = path.join(root, 'storage');
  const context = {
    extensionUri: Uri.file(path.resolve(__dirname, '..')),
    globalStorageUri: Uri.file(storage),
    globalState: memento(), workspaceState: memento(), subscriptions: [] as { dispose(): unknown }[],
    secrets: {
      get: async (key: string) => {
        const value = secrets.get(key);
        secretReads.count++;
        if (secretReads.delayMs) await new Promise(resolve => setTimeout(resolve, secretReads.delayMs));
        return value;
      },
      store: async (key: string, value: string) => { secrets.set(key, value); },
      delete: async (key: string) => { secrets.delete(key); }
    }
  };
  const commands = new Map<string, (...args: unknown[]) => unknown>();
  const contexts = new Map<string, unknown>();
  const progressCancellations: (() => void)[] = [];
  const notices: string[] = [];
  const logs: string[] = [];
  const externalUrls: string[] = [];
  const terminals: { options: vscode.TerminalOptions; command?: string }[] = [];
  const focus = new Emitter<{ focused: boolean }>();
  const input = { provider: 'gemini', value: 'fixture-secret' };
  const repos = [1, 2].map(index => {
    const cwd = path.join(root, `repo-${index}`);
    fs.mkdirSync(cwd);
    const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' });
    git('init', '--quiet');
    fs.writeFileSync(path.join(cwd, 'sample.txt'), 'before\n');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'core.hooksPath=/dev/null',
      'commit', '--quiet', '-m', 'chore: fixture');
    fs.writeFileSync(path.join(cwd, 'sample.txt'), 'after\n');
    return {
      rootUri: Uri.file(cwd), inputBox: { value: '' }, git,
      diffIndexWithHEAD: async () => git('diff', '--cached'),
      diffWithHEAD: async () => git('diff')
    };
  });
  let panel: CommitPanelProvider | undefined;
  const stub = {
    Uri, EventEmitter: Emitter, ProgressLocation: { Notification: 15, SourceControl: 1 },
    workspace: { getConfiguration: () => config },
    commands: {
      registerCommand: (id: string, handler: (...args: unknown[]) => unknown) => {
        commands.set(id, handler);
        return { dispose: () => commands.delete(id) };
      },
      executeCommand: async (id: string, ...args: unknown[]) => {
        if (id === 'setContext') {
          assert.ok(typeof args[0] === 'string');
          contexts.set(args[0], args[1]);
          return;
        }
        return commands.get(id)?.(...args);
      }
    },
    extensions: { getExtension: () => ({ isActive: true, exports: { getAPI: () => ({ repositories: repos }) } }) },
    env: { openExternal: async (uri: Uri) => { externalUrls.push(uri.toString()); return true; } },
    window: {
      activeTextEditor: undefined as { document: { uri: Uri } } | undefined,
      createOutputChannel: () => ({ appendLine: (line: string) => logs.push(line), dispose() {} }),
      registerWebviewViewProvider: (_id: string, provider: CommitPanelProvider) => { panel = provider; return { dispose() {} }; },
      showInformationMessage: async (text: string) => { notices.push(text); },
      showErrorMessage: async (text: string) => { notices.push(text); },
      showQuickPick: async (options: { label: string; value: string }[]) => options.find(option => option.value === input.provider),
      showInputBox: async () => input.value,
      onDidChangeWindowState: focus.event,
      createTerminal: (options: vscode.TerminalOptions) => {
        const terminal = { options, command: undefined as string | undefined };
        terminals.push(terminal);
        return { show() {}, sendText: (command: string) => {
          terminal.command = command;
          const home = options.env?.CODEX_HOME;
          assert.ok(home, '専用 CODEX_HOME が指定される');
          fs.writeFileSync(path.join(home, 'auth.fixture'), 'fixture');
        } };
      },
      withProgress: async <T>(_options: vscode.ProgressOptions, work: (
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
      ) => PromiseLike<T>) => {
        const cancellation = new Emitter<void>();
        progressCancellations.push(() => cancellation.fire(undefined));
        try { return await work({ report() {} }, { isCancellationRequested: false, onCancellationRequested: cancellation.event }); }
        finally { cancellation.dispose(); }
      }
    }
  };
  // VS Code の入口だけを差し替え、終了時に Node の読み込み処理を復元する。
  const nodeModule = require('module') as { _load(id: string, ...args: unknown[]): unknown };
  const originalLoad = nodeModule._load;
  nodeModule._load = function (id: string, ...args: unknown[]) {
    return id === 'vscode' ? stub : originalLoad.call(this, id, ...args);
  };
  const originalFetch = global.fetch;
  const requests: { url: string; body: unknown; headers: unknown }[] = [];
  const modelBytes = Buffer.from('GGUF fixture bytes');
  user.set('localModelUrl', 'https://fixture.example/model.gguf');
  user.set('localModelFilename', 'fixture.gguf');
  user.set('localModelSha256', crypto.createHash('sha256').update(modelBytes).digest('hex'));
  global.fetch = async (target, options) => {
    const url = String(target);
    if (url.startsWith('http://127.0.0.1:')) return originalFetch(target, options);
    assert.ok(url.startsWith('https://fixture.example/'), `隔離対象外の通信: ${url}`);
    options?.signal?.throwIfAborted();
    if (url.endsWith('/model.gguf')) {
      let timer: ReturnType<typeof setTimeout>;
      return new Response(new ReadableStream({
        start(stream) {
          const middle = Math.floor(modelBytes.length / 2);
          stream.enqueue(modelBytes.subarray(0, middle));
          timer = setTimeout(() => { stream.enqueue(modelBytes.subarray(middle)); stream.close(); }, 250);
        },
        cancel() { clearTimeout(timer); }
      }), { headers: { 'content-length': String(modelBytes.length) } });
    }
    if (url.endsWith('/models')) {
      const models = require('../src/constants').MODEL_SUGGESTIONS_BY_PROVIDER.openai;
      return new Response(JSON.stringify({ data: [...models, 'custom-model'].map(id => ({ id })) }));
    }
    const body: unknown = JSON.parse(String(options?.body));
    requests.push({ url, body, headers: options?.headers });
    if (JSON.stringify(body).includes('SLOW_FIXTURE')) {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
        const timer = setTimeout(() => { options?.signal?.removeEventListener('abort', onAbort); resolve(); }, 150);
        options?.signal?.addEventListener('abort', onAbort, { once: true });
      });
    }
    if (JSON.stringify(body).includes('FAIL_FIXTURE')) return new Response('fixture failure', { status: 400 });
    if (JSON.stringify(body).includes('INCOMPLETE_FIXTURE')) {
      if (url.includes('/gemini/')) {
        return new Response(JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS',
          content: { parts: [{ text: 'fix: unfinished' }] } }] }));
      }
      if (url.includes('/claude/')) {
        return new Response(JSON.stringify({ stop_reason: 'max_tokens',
          content: [{ type: 'text', text: 'fix: unfinished' }] }));
      }
      return new Response(JSON.stringify({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' },
        output_text: 'fix: unfinished' }));
    }
    const message = 'chore: 検証用の変更';
    return new Response(JSON.stringify(url.includes('/gemini/')
      ? { candidates: [{ content: { parts: [{ text: message }] } }] }
      : url.includes('/claude/') ? { content: [{ type: 'text', text: message }] } : { output_text: message }));
  };
  // テストプロセスに実際のクラウド認証情報を引き継がない。
  const credentialNames = ['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key',
    'COMMIT_MAKER_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key',
    'COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'anthropic_api_key'];
  const savedEnvironment = new Map(credentialNames.map(name => [name, process.env[name]]));
  credentialNames.forEach(name => { delete process.env[name]; });
  const codexPath = path.join(root, 'codex-fixture');
  await fs.promises.writeFile(codexPath, `#!/usr/bin/env node
const fs = require('fs'); const path = require('path'); const args = process.argv.slice(2);
const auth = path.join(process.env.CODEX_HOME, 'auth.fixture');
if (args[0] === '--version') { console.log('codex fixture'); }
else if (args[0] === 'login') { if (fs.existsSync(auth)) console.log('Logged in using fixture'); else process.exitCode = 1; }
else if (args[0] === 'logout') { fs.rmSync(auth, {force: true}); }
else if (args[0] === 'exec') { let prompt=''; process.stdin.setEncoding('utf8'); process.stdin.on('data', text => { prompt+=text; }); process.stdin.on('end', () => {
  if (prompt.includes('FAIL_CODEX_FIXTURE')) {
    process.stderr.write(prompt+'\\nERROR: '+JSON.stringify({error:{message:'The model is not supported. Bearer sk-proj-fixture1234567890'}})+'\\n');
    process.exitCode=1; return;
  }
  fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify({message: 'chore: 検証用の変更'}));
}); } else process.exitCode = 1;
`, { mode: 0o755 });
  user.set('codexCommand', codexPath);
  const localPath = path.join(root, 'llama-fixture');
  await fs.promises.writeFile(localPath, `#!/usr/bin/env node
const fs = require('fs'); const path = require('path');
fs.appendFileSync(path.join(__dirname, 'local-pids.txt'), process.pid + '\\n');
const http = require('http'); const args = process.argv.slice(2); const port = Number(args[args.indexOf('--port') + 1]);
http.createServer((req, res) => { res.setHeader('content-type', 'application/json');
  if (req.url === '/health') { res.end('{}'); return; }
  let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
    const input = JSON.parse(body); if (!input.messages || !input.max_tokens) { res.statusCode=400; res.end('{}'); return; }
    const prompt = JSON.stringify(input.messages);
    if (prompt.includes('EMPTY_LOCAL_FIXTURE')) { res.end(JSON.stringify({choices:[null]})); return; }
    if (prompt.includes('INCOMPLETE_LOCAL_FIXTURE')) {
      res.end(JSON.stringify({choices:[{finish_reason:'length',message:{content:'fix: unfinished'}}]})); return;
    }
    const respond = () => res.end(JSON.stringify({choices:[{message:{content:'<think>fixture</think>chore: 検証用の変更'}}]}));
    const holdPath = path.join(__dirname, 'local-test.hold');
    if (prompt.includes('Return exactly: local model ready') && fs.existsSync(holdPath)) {
      const timer = setInterval(() => {
        if (!fs.existsSync(holdPath)) { clearInterval(timer); respond(); }
      }, 10);
    } else respond();
  });
}).listen(port, '127.0.0.1');
`, { mode: 0o755 });
  user.set('localRuntimePath', localPath);
  user.set('localKeepAliveMs', 50);
  const extension = require('../src/extension') as typeof import('../src/extension');
  extension.activate(context as unknown as vscode.ExtensionContext);
  const messages = new Emitter<unknown>();
  const viewDisposed = new Emitter<void>();
  let html = '';
  const outbound: WebviewOutboundMessage[] = [];
  const updates = new Set<(kind: 'html' | 'state', value: unknown) => void>();
  const webview = {
    options: {}, cspSource: 'http://127.0.0.1',
    asWebviewUri: (uri: Uri) => ({ toString: () => webview.cspSource + '/' + path.relative(context.extensionUri.fsPath, uri.fsPath).split(path.sep).join('/') }),
    onDidReceiveMessage: messages.event,
    postMessage: async (message: WebviewOutboundMessage) => { outbound.push(message); updates.forEach(listener => listener('state', message)); return true; },
    get html() { return html; },
    set html(value: string) { html = value; updates.forEach(listener => listener('html', value)); }
  };
  const view = { webview, onDidDispose: viewDisposed.event, show() {} };
  assert.ok(panel, '拡張が Webview provider を登録する');
  panel.resolveWebviewView(view as unknown as vscode.WebviewView);
  const send = (message: unknown) => messages.fire(message);
  send({ type: 'ready' });
  await waitUntil(() => outbound.at(-1)?.state?.apiKeys?.codex !== undefined);
  return {
    root, config, user, context, secrets, secretReads, repos, commands, contexts, progressCancellations, errors, notices, logs,
    externalUrls, terminals, focus, input, requests, panel, webview, send, updates, emitters,
    get state() {
      const state = outbound.at(-1)?.state;
      assert.ok(state, '画面へ初期状態が送信される');
      return state;
    },
    holdLocalTest: () => fs.promises.writeFile(path.join(root, 'local-test.hold'), ''),
    releaseLocalTest: () => fs.promises.rm(path.join(root, 'local-test.hold'), { force: true }),
    get completedGenerations() {
      return outbound.filter((message, index) => message.state?.commitStatus === 'ready' &&
        outbound[index - 1]?.state?.commitStatus !== 'ready').length;
    },
    async dispose() {
      extension.deactivate();
      context.subscriptions.reverse().forEach(disposable => disposable.dispose());
      messages.dispose(); viewDisposed.dispose(); focus.dispose();
      global.fetch = originalFetch; nodeModule._load = originalLoad;
      for (const [name, value] of savedEnvironment) {
        if (value === undefined) delete process.env[name]; else process.env[name] = value;
      }
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  };
}

export async function waitUntil(check: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('検証状態の待機がタイムアウトしました');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
