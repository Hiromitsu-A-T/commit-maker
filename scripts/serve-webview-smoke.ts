import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { createHarness } from './test-support';
import type * as vscode from 'vscode';

async function main(): Promise<void> {
  const app = await createHarness({ requestTimeoutMs: 10000 });
  const clients = new Set<http.ServerResponse>();
  const root = path.resolve(__dirname, '..');
  const server = http.createServer(async (request, response) => {
    try {
      if (request.url === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      if (request.url === '/events') {
        response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
        response.write('\n');
        clients.add(response);
        request.on('close', () => clients.delete(response));
        return;
      }
      if (request.url === '/message' && request.method === 'POST') {
        let raw = '';
        for await (const chunk of request) raw += chunk;
        app.send(JSON.parse(raw));
        response.writeHead(204); response.end(); return;
      }
      if (request.method === 'POST' && ['/local-test/hold', '/local-test/release'].includes(request.url || '')) {
        if (request.url === '/local-test/hold') await app.holdLocalTest();
        else await app.releaseLocalTest();
        response.writeHead(204); response.end(); return;
      }
      if (request.url === '/diagnostics') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ state: app.state, scm: app.repos.map(repo => repo.inputBox.value),
          errors: app.errors.map(String), requests: app.requests.length, generations: app.completedGenerations, secrets: [...app.secrets.keys()] }));
        return;
      }
      if (request.url === '/') {
        const nonce = /nonce="([^"]+)"/.exec(app.webview.html)![1];
        // 通信ブリッジだけを加え、HTML・CSS・画面スクリプトは本番の renderer を使う。
        const bridge = `<script nonce="${nonce}">
          let pendingMessage = Promise.resolve();
          window.acquireVsCodeApi = () => ({ postMessage: message => {
            pendingMessage = pendingMessage.then(() => fetch('/message', {
              method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(message)
            }));
          } });
          const events = new EventSource('/events');
          events.onmessage = event => { const update = JSON.parse(event.data);
            if (update.kind === 'html') { location.reload(); }
            else { window.dispatchEvent(new MessageEvent('message', {data: update.value})); }
          };
        </script>`;
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end(app.webview.html.replace("default-src 'none';", "default-src 'none'; connect-src 'self';")
          .replace('<script nonce=', bridge + '<script nonce='));
        return;
      }
      const filename = path.resolve(root, '.' + decodeURIComponent(request.url || ''));
      const mediaRoot = path.join(root, 'media') + path.sep;
      if (!filename.startsWith(mediaRoot) || !/\.(js|css)$/.test(filename)) {
        response.writeHead(404); response.end(); return;
      }
      response.setHeader('content-type', filename.endsWith('.js') ? 'application/javascript' : 'text/css');
      response.end(await fs.promises.readFile(filename));
    } catch (error) {
      response.writeHead(500); response.end(String(error));
    }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('検証用サーバーの起動に失敗しました');
  const url = `http://127.0.0.1:${address.port}`;
  app.webview.cspSource = url;
  app.panel.resolveWebviewView({ webview: app.webview, onDidDispose: () => ({ dispose() {} }), show() {} } as unknown as vscode.WebviewView);
  app.updates.add((kind, value) => {
    const message = `data: ${JSON.stringify({ kind, value })}\n\n`;
    clients.forEach(client => client.write(message));
  });
  console.log(url);
  const close = async () => {
    clients.forEach(client => client.end());
    server.close();
    await app.dispose();
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
