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
    await downloadToFile('https://fixture.example/file', destination, undefined, value => progress.push(value.downloadedBytes));
    assert.strictEqual(await fs.promises.readFile(destination, 'utf8'), 'abc');
    assert.strictEqual(await sha256File(destination), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.strictEqual(progress.at(-1), 3);
    await assert.rejects(() => downloadToFile('https://fixture.example/file', root), { code: 'EISDIR' });
    const controller = new AbortController();
    global.fetch = async () => new Response(new ReadableStream({
      start(stream) { stream.enqueue(new Uint8Array([1, 2, 3])); },
      cancel() { controller.abort(); }
    }));
    await assert.rejects(() => downloadToFile('https://fixture.example/slow', destination, controller.signal,
      () => controller.abort()), { name: 'AbortError' });
    assert.strictEqual(controller.signal.aborted, true);
    global.fetch = async () => new Response('missing fixture', { status: 404 });
    await assert.rejects(() => downloadToFile('https://fixture.example/missing', destination), /HTTP 404/);
    console.log('fileDownload.test.ts passed');
  } finally {
    global.fetch = originalFetch;
    await fs.promises.rm(root, { recursive: true, force: true });
  }
}
