import * as http from 'http';
import { randomBytes } from 'crypto';
import { asRecord } from './shared';
import { readBoundedText, rejectRedirect } from '../httpResponse';

/** CLI のモデル要求を検査する。ツールが復活した設定では外部へ送信しない。 */
export async function startCodexTransport(signal?: AbortSignal): Promise<{ baseUrl: string; dispose(): Promise<void> }> {
  const nonce = randomBytes(32).toString('hex');
  const requests = new Set<AbortController>();
  let forwardedRequests = 0;
  const server = http.createServer((req, res) => {
    void (async () => {
      if (req.method !== 'POST' || req.url !== `/${nonce}/responses`) throw new Error('Unsupported Codex request.');
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 64 * 1024 * 1024) throw new Error('Codex request exceeds the byte limit.');
        chunks.push(chunk);
      }
      const body = asRecord(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      assertTextOnlyRequest(body);
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith('Bearer ')) throw new Error('Codex authentication is missing.');
      if (++forwardedRequests > 1) throw new Error('Codex request limit reached.');
      const account = req.headers['chatgpt-account-id'];
      const target = account ? 'https://chatgpt.com/backend-api/codex/responses' : 'https://api.openai.com/v1/responses';
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: authorization };
      for (const key of ['chatgpt-account-id', 'openai-beta', 'originator', 'version', 'session_id', 'conversation_id', 'x-codex-turn-metadata']) {
        const value = req.headers[key];
        if (typeof value === 'string') headers[key] = value;
      }
      const controller = new AbortController();
      const onAbort = (): void => controller.abort();
      requests.add(controller);
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) controller.abort();
      try {
        const upstream = await fetch(target, { method: 'POST', headers, body: JSON.stringify(body), redirect: 'manual', signal: controller.signal });
        await rejectRedirect(upstream);
        const text = await readBoundedText(upstream);
        const contentType = isEventStream(text, upstream.headers.get('content-type') ?? '')
          ? 'text/event-stream' : 'application/json';
        assertTextOnlyResponse(text, contentType);
        res.writeHead(upstream.status, { 'Content-Type': contentType });
        res.end(text);
      } finally {
        signal?.removeEventListener('abort', onAbort);
        requests.delete(controller);
      }
    })().catch((error: unknown) => {
      if (!res.headersSent) res.writeHead(400, { 'Content-Type': 'application/json' });
      const allowed = ['Unsupported Codex request.', 'Codex tools must be disabled.', 'Codex additional tools are not allowed.',
        'Codex tool calls are not allowed.', 'Codex request limit reached.', 'HTTP response exceeds the byte limit.'];
      const reason = error instanceof SyntaxError ? 'Invalid JSON/SSE.'
        : error instanceof Error && allowed.includes(error.message) ? error.message : 'Upstream unavailable.';
      res.end(JSON.stringify({ error: { message: `Commit Maker rejected the Codex request/response: ${reason}` } }));
    });
  });
  server.on('upgrade', (_req, socket) => { socket.end('HTTP/1.1 426 Upgrade Required\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); });
  server.requestTimeout = 600000;
  server.headersTimeout = 10000;
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address() as import('net').AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}/${nonce}`,
    dispose: async () => {
      for (const controller of requests) controller.abort();
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  };
}

export function assertTextOnlyRequest(body: Record<string, unknown>): void {
  if (body.tools !== undefined && (!Array.isArray(body.tools) || body.tools.length !== 0)) {
    throw new Error('Codex tools must be disabled.');
  }
  if (body.tool_choice !== undefined && body.tool_choice !== 'none' && body.tool_choice !== 'auto') {
    throw new Error('Codex tool choice is not allowed.');
  }
  // ツール応答の再送も受け入れず、実行の連鎖を閉じる。
  assertNoToolCalls(body.input);
}

export function assertTextOnlyResponse(text: string, contentType: string): void {
  if (isEventStream(text, contentType)) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data && data !== '[DONE]') assertNoToolCalls(JSON.parse(data));
    }
  } else if (text.trim()) assertNoToolCalls(JSON.parse(text));
}

function assertNoToolCalls(value: unknown): void {
  if (Array.isArray(value)) { value.forEach(assertNoToolCalls); return; }
  if (!value || typeof value !== 'object') return;
  const record = asRecord(value);
  if (record.type === 'additional_tools' && (!Array.isArray(record.tools) || record.tools.length !== 0)) {
    throw new Error('Codex additional tools are not allowed.');
  }
  if (typeof record.type === 'string' && /(?:function|tool|shell|computer|web_search|code_interpreter|mcp|apply_patch)_call/.test(record.type)) {
    throw new Error('Codex tool calls are not allowed.');
  }
  Object.values(record).forEach(assertNoToolCalls);
}

function isEventStream(text: string, contentType: string): boolean {
  // Codex backend は Content-Type を省く場合もあるため、SSE の実体を確認する。
  return contentType.includes('text/event-stream') || /^(?:event:|data:)/.test(text.trimStart());
}
