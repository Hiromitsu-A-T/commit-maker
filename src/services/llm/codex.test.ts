import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { assertTextOnlyRequest, assertTextOnlyResponse, createTextOnlyRequest, createTextOnlyResponse } from './codexTransport';
import { assertCodexCapabilities, buildCodexExecArgs, buildTextOnlyCatalog, callCodex, parseCodexFeatures, parseCodexOutput } from './codex';

export async function runCodexLlmTests(): Promise<void> {
  const args = buildCodexExecArgs({
    model: 'gpt-6-luna',
    outputPath: '/tmp/out.json',
    schemaPath: '/tmp/schema.json',
    cwd: '/tmp/work',
    reasoning: 'high',
    features: ['future_exec', 'future.feature']
  });

  assert.ok(args.includes('--sandbox'));
  assert.ok(args.includes('read-only'));
  assert.ok(args.includes('approval_policy="never"'));
  assert.ok(args.includes('model_reasoning_effort="high"'));
  assert.ok(args.includes('--ephemeral'));
  assert.ok(args.includes('--ignore-user-config'));
  assert.ok(args.includes('--ignore-rules'));
  assert.ok(args.includes('--skip-git-repo-check'));
  assert.ok(args.includes('web_search="disabled"'));
  assert.ok(args.some(arg => arg.startsWith('features={') && arg.includes('"future_exec"=false') && arg.includes('"future.feature"=false')));
  assert.deepStrictEqual(args.slice(-3), ['--model', 'gpt-6-luna', '-']);

  assert.strictEqual(parseCodexOutput('{"message":"feat: Codex連携を追加"}'), 'feat: Codex連携を追加');
  assert.strictEqual(parseCodexOutput('```json\n{"message":"fix: 出力整形を修正"}\n```'), 'fix: 出力整形を修正');
  assert.strictEqual(parseCodexOutput('docs: READMEを更新'), 'docs: READMEを更新');
  const input = [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'fixture' }] }];
  assertTextOnlyRequest({ tools: [], input });
  assert.throws(() => assertTextOnlyRequest({ tools: [{ type: 'function', name: 'exec' }] }), /disabled/);
  assert.throws(() => assertTextOnlyRequest({ input: [{ type: 'additional_tools', tools: [{ name: 'file_read' }] }] }), /additional tools/);
  for (const type of ['function_call', 'custom_tool_call', 'local_shell_call', 'mcp_call', 'computer_call', 'web_search_call',
    'image_generation_call', 'file_search_call', 'tool_search_call', 'mcp_approval_request', 'future_action', 'function_call_output']) {
    assert.throws(() => assertTextOnlyRequest({ input: [{ type, role: 'user', content: 'fixture' }] }), /input/);
    assert.throws(() => assertTextOnlyResponse(JSON.stringify({ output: [{ type }] }), 'application/json'), /not allowed/);
    assert.throws(() => assertTextOnlyResponse('data: '+JSON.stringify({ type: 'response.output_item.added', item: { type } })+'\n', 'text/event-stream'), /not allowed/);
  }
  assert.throws(() => assertTextOnlyRequest({ input: [{ role: 'user', content: [{ type: 'input_image', image_url: 'file:///private' }] }] }), /input/);
  const outbound = createTextOnlyRequest({ model: 'custom-model', input: [{ ...input[0], future_tool: { command: 'read' } }],
    tools: [], future_tools: [{ type: 'future_action' }], text: { verbosity: 'low', future_tool: {} }, reasoning: { effort: 'high', future_tool: {} } });
  assert.strictEqual(outbound.future_tools, undefined);
  assert.deepStrictEqual(outbound.input, input);
  assert.deepStrictEqual(outbound.reasoning, { effort: 'high' });
  assert.strictEqual(outbound.tool_choice, 'none');
  assert.strictEqual(outbound.model, 'custom-model');
  const normal = { type: 'response.completed', response: { output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'fixture' }] }] } };
  assertTextOnlyResponse(JSON.stringify(normal), 'application/json');
  const future = JSON.parse(createTextOnlyResponse(JSON.stringify({ ...normal, future_action: { type: 'future_action' }, text: { format: { type: 'json_schema', schema: { type: 'object' } } } }), 'application/json'));
  assert.strictEqual(future.future_action, undefined);
  assert.strictEqual(future.text, undefined);
  assertTextOnlyResponse(': heartbeat\r\nevent: response.completed\r\ndata: '+JSON.stringify(normal)+'\r\n\r\n', '');
  assertTextOnlyResponse('data: {"type":"response.completed",\ndata: "response":{"output":[]}}\n\n', 'text/event-stream');
  assert.throws(() => assertTextOnlyResponse('event: response.future_action\ndata: '+JSON.stringify(normal)+'\n\n', 'text/event-stream'), /event/);
  assert.throws(() => assertTextOnlyResponse('event: response.output_text.done\ndata: '+JSON.stringify(normal)+'\n\n', 'text/event-stream'), /event/);
  assert.throws(() => assertTextOnlyResponse('data: {"output":[]}\n\n', 'text/event-stream'), /event/);

  const capabilities = '--sandbox read-only --ephemeral --ignore-user-config --ignore-rules --skip-git-repo-check --output-schema --output-last-message';
  assertCodexCapabilities(capabilities);
  assert.throws(() => assertCodexCapabilities(capabilities.replace('--ignore-rules', '')), /capability/);
  assert.deepStrictEqual(parseCodexFeatures('shell_tool stable true\nfuture_exec under development true\nfuture.feature experimental false\n'), ['shell_tool', 'future_exec', 'future.feature']);
  assert.throws(() => parseCodexFeatures('unknown format'), /incompatible/);
  assert.throws(() => parseCodexFeatures(''), /incompatible|no capabilities/);
  assert.throws(() => buildTextOnlyCatalog({ models: [] }, 'custom-model'), /metadata/);
  const catalog = buildTextOnlyCatalog({ models: [{ slug: 'gpt-6-luna', future_field: 'preserved', shell_type: 'shell' }] }, 'custom-model');
  assert.strictEqual(catalog.models[0].slug, 'custom-model');
  assert.strictEqual(catalog.models[0].shell_type, 'disabled');
  assert.deepStrictEqual(catalog.models[0].experimental_supported_tools, []);
  await verifyCliCompatibility();
  console.log('codex.test.ts passed');
}

async function verifyCliCompatibility(): Promise<void> {
  if (process.platform === 'win32') return; // 既存統合fixtureと同じPOSIX実行形式。
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-cli-contract-test-'));
  const command = path.join(root, 'codex');
  const originalFetch = global.fetch;
  let forwarded = 0;
  try {
    await fs.promises.writeFile(command, `#!/usr/bin/env node
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2); const root = __dirname;
const mode = fs.readFileSync(path.join(root, 'mode'), 'utf8');
if (args[0] === '--version') console.log('codex-cli '+mode);
else if (args[0] === 'exec' && args[1] === '--help') console.log('--sandbox read-only --ephemeral --ignore-user-config '+(mode === 'missing' ? '' : '--ignore-rules ')+'--skip-git-repo-check --output-schema --output-last-message');
else if (args[0] === 'features') console.log(mode === 'features' ? 'invalid-format' : 'future.exec stable true');
else if (args[0] === 'debug') console.log(JSON.stringify({models: mode === 'catalog' ? [] : [{slug:'gpt-6-luna'}]}));
else if (args[0] === 'exec') {
  let prompt=''; process.stdin.setEncoding('utf8'); process.stdin.on('data', text => {prompt+=text;});
  process.stdin.on('end', async () => { try {
    fs.appendFileSync(path.join(root, 'prompts'), prompt+'\\n');
    const output = args[args.indexOf('--output-last-message')+1];
    if (mode === 'bypass') { fs.writeFileSync(output, JSON.stringify({message:'fake'})); return; }
    if (mode === 'hang') { setTimeout(() => {}, 30000); return; }
    if (!args.some(arg => arg.startsWith('features={') && arg.includes('"future.exec"=false'))) throw new Error('feature still enabled');
    const base = JSON.parse(args.find(arg => arg.startsWith('model_providers.commit_maker.base_url=')).split('=').slice(1).join('='));
    const response = await fetch(base+'/responses', {method:'POST', headers:{authorization:'Bearer isolated-fixture'}, body:JSON.stringify({model:'custom-model',
      tools:mode === 'tools' ? [{type:'function',name:'read_file'}] : [],
      input:mode === 'input' ? [{type:'future_action'}] : [{role:'user',content:prompt}]})});
    const text = await response.text(); if (!response.ok) throw new Error(text);
    const event = text.split('\\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5))).find(event => event.item?.type === 'message');
    const message = event ? JSON.parse(event.item.content[0].text).message : JSON.parse(text).output_text;
    fs.writeFileSync(output, JSON.stringify({message}));
  } catch (error) { console.error('ERROR: '+error.message); process.exitCode=1; } });
}
`, { mode: 0o755 });
    global.fetch = async () => { forwarded++; return new Response(JSON.stringify({ output_text: 'fix: compatible CLI fixture' })); };
    const params = { prompt: 'SENSITIVE_DIFF_CANARY', model: 'custom-model', codexCommand: command, codexHome: root, timeoutMs: 5000 };
    for (const version of ['0.165.0', '1.0.0']) {
      await fs.promises.writeFile(path.join(root, 'mode'), version);
      assert.strictEqual(await callCodex(params), 'fix: compatible CLI fixture', '版番号に上限を設けず安全契約で判定する');
    }
    assert.strictEqual(forwarded, 2, 'offline probeは外部へ転送しない');
    for (const mode of ['missing', 'features', 'catalog', 'bypass', 'tools', 'input']) {
      await fs.promises.rm(path.join(root, 'prompts'), { force: true });
      await fs.promises.writeFile(path.join(root, 'mode'), mode);
      await assert.rejects(() => callCodex(params), /capability|incompatible|metadata|compatibility check/);
      const prompts = await fs.promises.readFile(path.join(root, 'prompts'), 'utf8').catch(() => '');
      assert.ok(!prompts.includes('SENSITIVE_DIFF_CANARY'), '安全契約を確認できないCLIには実際の差分を渡さない');
    }
    assert.strictEqual(forwarded, 2);
    await fs.promises.writeFile(path.join(root, 'mode'), 'hang');
    const beforeTimeout = Date.now();
    await assert.rejects(() => callCodex({ ...params, timeoutMs: 1000 }), /timed out/);
    assert.ok(Date.now()-beforeTimeout < 5000, '互換性検査も全体の期限に含める');
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(() => callCodex({ ...params, abortSignal: controller.signal }), /abort|cancel/i);
  } finally {
    global.fetch = originalFetch;
    await fs.promises.rm(root, { recursive: true, force: true });
  }
}
