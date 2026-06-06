import assert from 'assert';
import { buildCodexExecArgs, parseCodexOutput } from './codex';

export async function runCodexLlmTests(): Promise<void> {
  const args = buildCodexExecArgs({
    model: 'gpt-5.5',
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
  assert.deepStrictEqual(args.slice(-3), ['--model', 'gpt-5.5', '-']);

  assert.strictEqual(parseCodexOutput('{"message":"feat: Codex連携を追加"}'), 'feat: Codex連携を追加');
  assert.strictEqual(parseCodexOutput('```json\n{"message":"fix: 出力整形を修正"}\n```'), 'fix: 出力整形を修正');
  assert.strictEqual(parseCodexOutput('docs: READMEを更新'), 'docs: READMEを更新');
  console.log('codex.test.ts passed');
}
