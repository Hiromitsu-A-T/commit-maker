import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { downloadToFile, sha256File } from './fileDownload';

export async function runFileDownloadTests(): Promise<void> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-transfer-'));
  const originalFetch = global.fetch;
  try {
    const destination = path.join(root, 'fixture');
    global.fetch = async () => new Response('abc', { headers: { 'content-length': '3' } });
    const progress: number[] = [];
    await downloadToFile('https://fixture.example/file', destination, { maxBytes: 1024, timeoutMs: 1000 }, undefined, value => progress.push(value.downloadedBytes));
    assert.strictEqual(await fs.promises.readFile(destination, 'utf8'), 'abc');
    assert.strictEqual(await sha256File(destination), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const cancelledHash = new AbortController();
    cancelledHash.abort();
    await assert.rejects(() => sha256File(path.join(root, 'missing'), cancelledHash.signal), { name: 'AbortError' });
    assert.strictEqual(progress.at(-1), 3);
    await assert.rejects(() => downloadToFile('https://fixture.example/file', root, { maxBytes: 1024, timeoutMs: 1000 }), { code: 'EISDIR' });
    const controller = new AbortController();
    global.fetch = async () => new Response(new ReadableStream({
      start(stream) { stream.enqueue(new Uint8Array([1, 2, 3])); },
      cancel() { controller.abort(); }
    }));
    await assert.rejects(() => downloadToFile('https://fixture.example/slow', destination, { maxBytes: 1024, timeoutMs: 1000 }, controller.signal,
      () => controller.abort()), { name: 'AbortError' });
    assert.strictEqual(controller.signal.aborted, true);
    global.fetch = async () => new Response('missing fixture', { status: 404 });
    await assert.rejects(() => downloadToFile('https://fixture.example/missing', destination, { maxBytes: 1024, timeoutMs: 1000 }), /HTTP 404/);
    for (const headers of [{ 'content-length': '100000' }, { 'content-length': '1' }, {}] as Record<string, string>[]) {
      global.fetch = async () => new Response('x'.repeat(2048), { headers });
      await assert.rejects(() => downloadToFile('https://fixture.example/large', destination,
        { maxBytes: 1024, timeoutMs: 1000 }), /byte limit/);
      assert.ok(!fs.existsSync(destination), '超過時は部分ファイルを削除する');
    }
    let fetchCount = 0;
    global.fetch = async () => { fetchCount++; return new Response('', { status: 307, headers: { location: 'http://127.0.0.1/private' } }); };
    await assert.rejects(() => downloadToFile('https://fixture.example/redirect', destination,
      { maxBytes: 1024, timeoutMs: 1000 }), /destination/);
    assert.strictEqual(fetchCount, 1);
    global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('deadline', 'AbortError')), { once: true });
    });
    await assert.rejects(() => downloadToFile('https://fixture.example/stall', destination,
      { maxBytes: 1024, timeoutMs: 15 }), { name: 'AbortError' });
    console.log('fileDownload.test.ts passed');
  } finally {
    global.fetch = originalFetch;
    await fs.promises.rm(root, { recursive: true, force: true });
  }
}
