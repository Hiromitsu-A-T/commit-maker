import assert from 'assert';
import { assertTextOnlyRequest, assertTextOnlyResponse } from './codexTransport';
import { buildCodexExecArgs, parseCodexOutput } from './codex';

export async function runCodexLlmTests(): Promise<void> {
  const args = buildCodexExecArgs({
    model: 'gpt-6-luna',
    outputPath: '/tmp/out.json',
    schemaPath: '/tmp/schema.json',
    cwd: '/tmp/work',
    reasoning: 'high'
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
  assert.deepStrictEqual(args.slice(-3), ['--model', 'gpt-6-luna', '-']);

  assert.strictEqual(parseCodexOutput('{"message":"feat: Codex連携を追加"}'), 'feat: Codex連携を追加');
  assert.strictEqual(parseCodexOutput('```json\n{"message":"fix: 出力整形を修正"}\n```'), 'fix: 出力整形を修正');
  assert.strictEqual(parseCodexOutput('docs: READMEを更新'), 'docs: READMEを更新');
  assertTextOnlyRequest({ tools: [], input: [{ type: 'message', content: 'fixture' }] });
  assert.throws(() => assertTextOnlyRequest({ tools: [{ type: 'function', name: 'exec' }] }), /disabled/);
  assert.throws(() => assertTextOnlyRequest({ input: [{ type: 'additional_tools', tools: [{ name: 'file_read' }] }] }), /additional tools/);
  for (const type of ['function_call', 'custom_tool_call', 'local_shell_call', 'mcp_call', 'computer_call', 'web_search_call']) {
    assert.throws(() => assertTextOnlyResponse(JSON.stringify({ output: [{ type }] }), 'application/json'), /not allowed/);
    assert.throws(() => assertTextOnlyResponse('data: '+JSON.stringify({ type: 'response.output_item.added', item: { type } })+'\n', 'text/event-stream'), /not allowed/);
  }
  console.log('codex.test.ts passed');
}
