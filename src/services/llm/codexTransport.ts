import * as http from 'http';
import { randomBytes } from 'crypto';
import { asRecord } from './shared';
import { readBoundedText, rejectRedirect } from '../httpResponse';

/** CLI のモデル要求を検査する。ツールが復活した設定では外部へ送信しない。 */
export async function startCodexTransport(signal?: AbortSignal, probeMessage?: string): Promise<{ baseUrl: string; readonly completed: boolean; dispose(): Promise<void> }> {
  const nonce = randomBytes(32).toString('hex');
  const requests = new Set<AbortController>();
  let forwardedRequests = 0;
  let completed = false;
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
      const outbound = createTextOnlyRequest(body);
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith('Bearer ')) throw new Error('Codex authentication is missing.');
      if (++forwardedRequests > 1) throw new Error('Codex request limit reached.');
      if (probeMessage !== undefined) {
        const item = { id: 'msg_probe', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify({ message: probeMessage }) }] };
        const events = [
          { type: 'response.created', response: { id: 'resp_probe', status: 'in_progress', output: [] } },
          { type: 'response.output_item.done', output_index: 0, item },
          { type: 'response.completed', response: { id: 'resp_probe', status: 'completed', output: [item] } }
        ];
        completed = true;
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.end(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''));
        return;
      }
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
        const upstream = await fetch(target, { method: 'POST', headers, body: JSON.stringify(outbound), redirect: 'manual', signal: controller.signal });
        await rejectRedirect(upstream);
        const text = await readBoundedText(upstream);
        const contentType = isEventStream(text, upstream.headers.get('content-type') ?? '')
          ? 'text/event-stream' : 'application/json';
        const validated = createTextOnlyResponse(text, contentType);
        completed = upstream.ok;
        res.writeHead(upstream.status, { 'Content-Type': contentType });
        res.end(validated);
      } finally {
        signal?.removeEventListener('abort', onAbort);
        requests.delete(controller);
      }
    })().catch((error: unknown) => {
      if (!res.headersSent) res.writeHead(400, { 'Content-Type': 'application/json' });
      const allowed = ['Unsupported Codex request.', 'Codex tools must be disabled.', 'Codex additional tools are not allowed.',
        'Codex tool calls are not allowed.', 'Codex request limit reached.', 'HTTP response exceeds the byte limit.',
        'Unsupported Codex text-only input.', 'Unsupported Codex response type.', 'Unsupported Codex response event.'];
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
    get completed() { return completed; },
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
  // 最初の一要求にはテキストのmessageだけが必要。未知の型も通さない。
  if (typeof body.input === 'string') return;
  if (!Array.isArray(body.input) || !body.input.length) throw new Error('Unsupported Codex text-only input.');
  for (const item of body.input) {
    const message = asRecord(item);
    if (message.type === 'additional_tools') throw new Error('Codex additional tools are not allowed.');
    if ((message.type !== undefined && message.type !== 'message') || !['system', 'developer', 'user', 'assistant'].includes(String(message.role))) {
      throw new Error('Unsupported Codex text-only input.');
    }
    if (typeof message.content === 'string') continue;
    if (!Array.isArray(message.content)) throw new Error('Unsupported Codex text-only input.');
    for (const part of message.content) {
      const content = asRecord(part);
      if (!['input_text', 'output_text', 'text'].includes(String(content.type)) || typeof content.text !== 'string') {
        throw new Error('Unsupported Codex text-only input.');
      }
    }
  }
}

/** 未知のトップレベル機能・messageフィールドを上流へ引き継がない。 */
export function createTextOnlyRequest(body: Record<string, unknown>): Record<string, unknown> {
  assertTextOnlyRequest(body);
  if (typeof body.model !== 'string' || !body.model.trim()) throw new Error('Unsupported Codex text-only input.');
  const input = typeof body.input === 'string' ? body.input : (body.input as unknown[]).map(item => {
    const message = asRecord(item);
    return { type: 'message', role: message.role, content: typeof message.content === 'string' ? message.content
      : (message.content as unknown[]).map(part => { const content = asRecord(part); return { type: content.type, text: content.text }; }) };
  });
  const result: Record<string, unknown> = { model: body.model, input, tools: [], tool_choice: 'none', parallel_tool_calls: false, stream: true, store: false };
  for (const key of ['instructions', 'prompt_cache_key', 'service_tier']) {
    if (typeof body[key] === 'string') result[key] = body[key];
  }
  const reasoning = asRecord(body.reasoning);
  if (typeof reasoning.effort === 'string') result.reasoning = { effort: reasoning.effort };
  const text = asRecord(body.text);
  const format = asRecord(text.format);
  result.text = {
    ...(typeof text.verbosity === 'string' ? { verbosity: text.verbosity } : {}),
    ...(format.type === 'json_schema' ? { format: { type: 'json_schema', name: format.name, strict: format.strict, schema: format.schema } } : {})
  };
  if (Array.isArray(body.include)) result.include = body.include.filter(item => item === 'reasoning.encrypted_content');
  // Codex backend の計測用情報は文字列のmapだけを許す。
  const metadata = asRecord(body.client_metadata);
  if (Object.keys(metadata).length && Object.values(metadata).every(value => typeof value === 'string')) {
    result.client_metadata = metadata;
  }
  return result;
}

const TEXT_ONLY_EVENTS = new Set([
  'response.created', 'response.queued', 'response.in_progress', 'response.completed', 'response.incomplete', 'response.failed',
  'response.output_item.added', 'response.output_item.done', 'response.content_part.added', 'response.content_part.done',
  'response.output_text.delta', 'response.output_text.done', 'response.refusal.delta', 'response.refusal.done',
  'response.reasoning_summary_part.added', 'response.reasoning_summary_part.done',
  'response.reasoning_summary_text.delta', 'response.reasoning_summary_text.done',
  'response.reasoning_text.delta', 'response.reasoning_text.done',
  'response.metadata', 'codex.response.metadata', 'responsesapi.websocket_timing', 'error'
]);
export function assertTextOnlyResponse(text: string, contentType: string): void {
  createTextOnlyResponse(text, contentType);
}

/** 検査済みの項目から応答を再構築し、将来の制御フィールドをCLIへ渡さない。 */
export function createTextOnlyResponse(text: string, contentType: string): string {
  if (isEventStream(text, contentType)) {
    const events: string[] = [];
    // SSEの複数data行は一つのJSONとして結合する。event名も検査する。
    for (const block of text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n\n')) {
      let event: string | undefined;
      const data: string[] = [];
      for (const line of block.split(/\r\n|\n|\r/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (event && !TEXT_ONLY_EVENTS.has(event)) throw new Error('Unsupported Codex response event.');
      const payload = data.join('\n').trim();
      if (!payload || payload === '[DONE]') continue;
      const value: unknown = JSON.parse(payload);
      const record = asRecord(value);
      const type = record.type;
      if (typeof type !== 'string' || !TEXT_ONLY_EVENTS.has(type) || (event && type !== event)) {
        throw new Error('Unsupported Codex response event.');
      }
      const result = pickScalars(record, ['type', 'sequence_number', 'output_index', 'item_id', 'content_index', 'summary_index', 'delta', 'text', 'refusal', 'code', 'message', 'param']);
      if (record.item !== undefined) result.item = textOnlyItem(record.item);
      if (record.part !== undefined) result.part = textOnlyPart(record.part);
      if (record.response !== undefined) result.response = textOnlyResponse(record.response);
      if (record.error !== undefined) result.error = pickScalars(asRecord(record.error), ['type', 'code', 'message', 'param']);
      events.push(`event: ${type}\ndata: ${JSON.stringify(result)}\n\n`);
    }
    return events.join('');
  }
  return text.trim() ? JSON.stringify(textOnlyResponse(JSON.parse(text))) : '';
}

function textOnlyResponse(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  if (record.type !== undefined && record.type !== 'response' && !TEXT_ONLY_EVENTS.has(String(record.type))) {
    throw new Error('Codex tool calls are not allowed.');
  }
  const result = pickScalars(record, ['id', 'object', 'type', 'status', 'output_text', 'end_turn']);
  if (record.output !== undefined) {
    if (!Array.isArray(record.output)) throw new Error('Unsupported Codex response type.');
    result.output = record.output.map(textOnlyItem);
  }
  if (record.usage !== undefined) {
    const usage = asRecord(record.usage);
    result.usage = pickScalars(usage, ['input_tokens', 'output_tokens', 'total_tokens', 'codex_rollout_budget_units']);
    for (const key of ['input_tokens_details', 'output_tokens_details']) {
      if (usage[key] !== undefined) (result.usage as Record<string, unknown>)[key] = pickScalars(asRecord(usage[key]), ['cached_tokens', 'cache_write_tokens', 'reasoning_tokens']);
    }
  }
  if (record.error !== undefined) result.error = pickScalars(asRecord(record.error), ['type', 'code', 'message', 'param']);
  if (record.incomplete_details !== undefined) result.incomplete_details = pickScalars(asRecord(record.incomplete_details), ['reason']);
  return result;
}

function textOnlyItem(value: unknown): Record<string, unknown> {
  const item = asRecord(value);
  if (item.type !== 'message' && item.type !== 'reasoning') throw new Error('Codex tool calls are not allowed.');
  const result = pickScalars(item, ['id', 'type', 'status']);
  if (item.type === 'message') {
    if (item.role !== 'assistant' || !Array.isArray(item.content)) throw new Error('Unsupported Codex response type.');
    result.role = 'assistant';
    result.content = item.content.map(textOnlyPart);
    if (item.phase === 'commentary' || item.phase === 'final') result.phase = item.phase;
  } else {
    for (const key of ['summary', 'content']) {
      if (item[key] === undefined || item[key] === null) continue;
      if (!Array.isArray(item[key])) throw new Error('Unsupported Codex response type.');
      result[key] = (item[key] as unknown[]).map(textOnlyPart);
    }
    if (typeof item.encrypted_content === 'string') result.encrypted_content = item.encrypted_content;
  }
  return result;
}

function textOnlyPart(value: unknown): Record<string, unknown> {
  const part = asRecord(value);
  if (!['output_text', 'refusal', 'summary_text', 'reasoning_text'].includes(String(part.type))) {
    throw new Error('Codex tool calls are not allowed.');
  }
  return pickScalars(part, ['type', 'text', 'refusal']);
}

function pickScalars(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter(key => ['string', 'number', 'boolean'].includes(typeof record[key])).map(key => [key, record[key]]));
}

function isEventStream(text: string, contentType: string): boolean {
  // Codex backend は Content-Type を省く場合もあるため、SSE の実体を確認する。
  return contentType.includes('text/event-stream') || /^(?::|event:|data:|id:|retry:)/.test(text.trimStart());
}
