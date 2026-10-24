import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { startCodexTransport } from './codexTransport';
import { limitTimeout } from '../../resourceLimits';
import { CodexReasoningEffort } from '../../types';
import { asRecord, sanitizeLlmErrorText } from './shared';
import { buildCodexEnvironment } from '../codexCli';

export interface CodexCallParams {
  prompt: string;
  model: string;
  codexCommand?: string;
  codexHome?: string;
  reasoning?: CodexReasoningEffort;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  logger?: (message: string) => void;
}

interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
}

const CODEX_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description: 'The final commit message only.'
    }
  },
  required: ['message'],
  additionalProperties: false
};

export async function callCodex({
  prompt,
  model,
  codexCommand = 'codex',
  codexHome,
  reasoning = 'low',
  abortSignal,
  timeoutMs,
  logger
}: CodexCallParams): Promise<string> {
  timeoutMs = limitTimeout(timeoutMs);
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-codex-'));
  const outputPath = path.join(tempDir, 'last-message.json');
  const schemaPath = path.join(tempDir, 'schema.json');
  const catalogPath = path.join(tempDir, 'models.json');
  const externalSignal = abortSignal;
  const controller = new AbortController();
  const cancel = (): void => controller.abort();
  externalSignal?.addEventListener('abort', cancel, { once: true });
  if (externalSignal?.aborted) controller.abort();
  abortSignal = controller.signal;
  let timedOut = false;
  const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  let transport: Awaited<ReturnType<typeof startCodexTransport>> | undefined;
  try {
    const features = await prepareTextOnlyCli(codexCommand, model, catalogPath, abortSignal);
    await fs.promises.writeFile(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA), 'utf8');
    await verifyTextOnlyCli(codexCommand, { model, cwd: tempDir, schemaPath, catalogPath, features, reasoning, abortSignal, timeoutMs: Math.min(timeoutMs, 15000) });
    transport = await startCodexTransport(abortSignal);
    const args = buildCodexExecArgs({ model, outputPath, schemaPath, cwd: tempDir, reasoning, catalogPath, baseUrl: transport.baseUrl, features });
    logger?.(`Codex: ${codexCommand} ${args.map(quoteArgForLog).join(' ')}`);
    const result = await runCodexExec(codexCommand, args, buildCodexPrompt(prompt), {
      abortSignal,
      codexHome,
      requestHome: tempDir,
      timeoutMs
    });
    if (result.code !== 0) {
      const detail = getCodexFailureDetail(result.stderr || result.stdout || `exit code ${result.code}`);
      throw new Error(`Codex execution failed: ${detail}`);
    }
    if (!transport.completed) throw new Error('Codex CLI bypassed the text-only transport.');
    const output = await readOutputFile(outputPath, result.stdout);
    const parsed = parseCodexOutput(output);
    if (!parsed.trim()) {
      throw new Error('Codex response was empty.');
    }
    return parsed;
  } catch (error) {
    if (timedOut) throw new Error('Codex execution timed out.', { cause: error });
    throw error;
  } finally {
    clearTimeout(deadline);
    externalSignal?.removeEventListener('abort', cancel);
    await transport?.dispose();
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function getCodexFailureDetail(output: string): string {
  // CLI は入力も stderr に出すため、末尾のエラーを選んでから長さを制限する。
  const errors = output.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\s*error:\s*(.+)/i);
    return match ? [match[1]] : [];
  });
  const detail = errors.at(-1);
  if (detail) {
    try {
      const payload = asRecord(JSON.parse(detail));
      const message = asRecord(payload.error).message ?? payload.message;
      if (typeof message === 'string' && message.trim()) {
        return sanitizeLlmErrorText(message);
      }
    } catch {
      // 構造化されていない CLI のエラーもそのまま表示する。
    }
  }
  return sanitizeLlmErrorText(detail ?? output.trim().slice(-1000));
}

export function buildCodexExecArgs({
  model,
  outputPath,
  schemaPath,
  cwd,
  reasoning = 'low',
  catalogPath,
  baseUrl,
  features = []
}: {
  model: string;
  outputPath: string;
  schemaPath: string;
  cwd: string;
  reasoning?: CodexReasoningEffort;
  catalogPath?: string;
  baseUrl?: string;
  features?: readonly string[];
}): string[] {
  const args = [
    'exec',
    '--sandbox',
    'read-only',
    '--ephemeral',
    '--ignore-user-config',
    '--ignore-rules',
    '--skip-git-repo-check',
    '--color',
    'never',
    '-C',
    cwd,
    '--output-schema',
    schemaPath,
    '--output-last-message',
    outputPath,
    '-c',
    'approval_policy="never"',
    '-c',
    `model_reasoning_effort="${reasoning}"`,
    '-c',
    'model_verbosity="low"',
    '-c',
    'web_search="disabled"'
  ];
  // CLIのdotted-path overrideは機能名内の「.」も分割するため、tableとして渡す。
  const disabled = [...new Set([...TEXT_ONLY_FEATURES, ...features])].map(key => `${JSON.stringify(key)}=false`).join(',');
  args.push('-c', `features={${disabled}}`);
  for (const value of ['agents.enabled=false', 'tools.update_plan.enabled=false', 'tools.experimental_request_user_input.enabled=false', 'skills.bundled.enabled=false', 'skills.include_instructions=false', 'cloud.skills.enabled=false', 'token_budget.enabled=false', 'token_budget.use_history_notes_extension=false']) args.push('-c', value);
  if (catalogPath) args.push('-c', `model_catalog_json=${JSON.stringify(catalogPath)}`);
  if (baseUrl) {
    for (const value of ['model_provider="commit_maker"', 'model_providers.commit_maker.name="Commit Maker"',
      `model_providers.commit_maker.base_url=${JSON.stringify(baseUrl)}`, 'model_providers.commit_maker.wire_api="responses"',
      'model_providers.commit_maker.requires_openai_auth=true', 'model_providers.commit_maker.supports_websockets=false',
      'model_providers.commit_maker.request_max_retries=0', 'model_providers.commit_maker.stream_max_retries=0']) args.push('-c', value);
  }
  const normalizedModel = model.trim();
  if (normalizedModel) {
    args.push('--model', normalizedModel);
  }
  args.push('-');
  return args;
}

export function parseCodexOutput(raw: string): string {
  const text = cleanupCommitMessage(raw);
  if (!text) return '';
  try {
    const data = asRecord(JSON.parse(text));
    if (typeof data.message === 'string') {
      return cleanupCommitMessage(data.message);
    }
  } catch {
    // 古い CLI が schema 指定時にも返すプレーンテキストを受け入れる。
  }
  return text;
}

function buildCodexPrompt(prompt: string): string {
  return [
    'You are being called by the Commit Maker VS Code extension.',
    'Use only the diff and user instructions in this prompt.',
    'Do not run shell commands, inspect files, browse the web, edit files, or ask for approval.',
    'Return exactly one JSON object that matches the provided output schema.',
    'The "message" value must contain only the final commit message.',
    'Do not include explanations, markdown fences, reasoning, or metadata.',
    '',
    prompt
  ].join('\n');
}

function cleanupCommitMessage(value: string): string {
  let text = value.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return text;
}

async function readOutputFile(outputPath: string, fallback: string): Promise<string> {
  try {
    const raw = await fs.promises.readFile(outputPath, 'utf8');
    if (raw.trim()) return raw;
  } catch {
    // 最終メッセージのファイルを読めない場合は stdout の互換応答を使う。
  }
  return fallback;
}

function runCodexExec(
  command: string,
  args: string[],
  stdin: string,
  options: { abortSignal?: AbortSignal; codexHome?: string; requestHome: string; timeoutMs: number }
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.requestHome,
      env: buildIsolatedEnvironment(options.codexHome, options.requestHome)
    });
    const stdout: string[] = [];
    const stderr: string[] = [];
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = (): void => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (options.abortSignal) {
        options.abortSignal.removeEventListener('abort', onAbort);
      }
    };

    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const kill = (): void => {
      if (!child.killed) {
        child.kill();
      }
    };

    const onAbort = (): void => {
      kill();
      finish(() => reject(new Error('Codex execution was cancelled.')));
    };

    if (options.abortSignal?.aborted) {
      onAbort();
      return;
    }
    if (options.abortSignal) {
      options.abortSignal.addEventListener('abort', onAbort, { once: true });
    }
    if (options.timeoutMs > 0) {
      timer = setTimeout(() => {
        kill();
        finish(() => reject(new Error('Codex execution timed out.')));
      }, options.timeoutMs);
    }

    child.stdout.on('data', chunk => stdout.push(String(chunk)));
    child.stderr.on('data', chunk => stderr.push(String(chunk)));
    child.stdin.on('error', () => undefined);
    child.once('error', error => {
      finish(() => reject(new Error(`Codex CLI not available: ${error.message}`)));
    });
    child.once('close', (code, signal) => {
      finish(() => resolve({ stdout: stdout.join(''), stderr: stderr.join(''), code, signal }));
    });

    child.stdin.end(stdin);
  });
}

function quoteArgForLog(value: string): string {
  return /^[A-Za-z0-9_./:=\-"]+$/.test(value) ? value : JSON.stringify(value);
}

// 既知の防御設定に加え、そのCLIが公開する機能を毎回無効化する。
const TEXT_ONLY_FEATURES = [
  'shell_tool', 'view_image', 'apps', 'plugins', 'image_generation', 'goals', 'memories',
  'multi_agent', 'multi_agent_v2', 'code_mode', 'code_mode_only', 'hooks', 'token_budget',
  'skill_search', 'executor_capability_discovery', 'executor_capability_discovery_v2',
  'tool_suggest', 'sleep_tool', 'request_permissions_tool', 'send_message_to_user_async',
  'deferred_executor', 'multi_env_copy_file', 'agent_message_board', 'responses_websockets',
  'responses_websockets_v2', 'enable_request_compression'
];

async function prepareTextOnlyCli(command: string, model: string, file: string, signal?: AbortSignal): Promise<string[]> {
  const run = promisify(execFile);
  const home = path.dirname(file);
  // 機能検出は認証も利用者の設定も必要としない。
  const options = { cwd: home, env: buildIsolatedEnvironment(home, home), signal, timeout: 10000, maxBuffer: 4 * 1024 * 1024 };
  const [help, featureList, bundled] = await Promise.all([
    run(command, ['exec', '--help'], options),
    run(command, ['features', 'list'], options),
    run(command, ['debug', 'models', '--bundled'], options)
  ]);
  assertCodexCapabilities(help.stdout);
  const features = parseCodexFeatures(featureList.stdout);
  const textOnly = buildTextOnlyCatalog(JSON.parse(bundled.stdout), model);
  await fs.promises.writeFile(file, JSON.stringify(textOnly), { mode: 0o600 });
  return features;
}

export function assertCodexCapabilities(help: string): void {
  for (const flag of ['--sandbox', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--skip-git-repo-check', '--output-schema', '--output-last-message']) {
    if (!help.includes(flag)) throw new Error(`Codex CLI is missing the text-only capability ${flag}. Update Codex CLI or Commit Maker.`);
  }
  if (!help.includes('read-only')) throw new Error('Codex CLI does not advertise the read-only sandbox.');
}

export function parseCodexFeatures(text: string): string[] {
  const keys = new Set<string>();
  for (const line of text.trim().split(/\r?\n/)) {
    const match = line.trim().match(/^([a-z][a-z0-9_.-]*)\s+.+?\s+(true|false)$/);
    if (!match) throw new Error('Codex CLI feature discovery is incompatible with text-only generation.');
    keys.add(match[1]);
  }
  if (!keys.size) throw new Error('Codex CLI feature discovery returned no capabilities.');
  return [...keys];
}

export function buildTextOnlyCatalog(value: unknown, model: string): { models: Record<string, unknown>[] } {
  const catalog = asRecord(value);
  const entries = Array.isArray(catalog.models) ? catalog.models : [];
  const base = asRecord(entries.find(item => asRecord(item).slug === model) ?? entries.find(item => asRecord(item).slug === 'gpt-6-luna'));
  if (!base.slug) throw new Error('Codex model metadata is missing.');
  const textOnly = { ...base, slug: model, display_name: model, shell_type: 'disabled', apply_patch_tool_type: null,
    experimental_supported_tools: [], tool_mode: 'direct', multi_agent_version: 'disabled',
    supports_search_tool: false, input_modalities: ['text'], node_repl_disabled: true,
    model_messages: null, use_responses_lite: false, base_instructions: 'Generate only the requested commit message. No tools are available.' };
  return { models: [textOnly] };
}

function buildIsolatedEnvironment(codexHome: string | undefined, requestHome: string): NodeJS.ProcessEnv {
  return { ...buildCodexEnvironment(codexHome), HOME: requestHome, USERPROFILE: requestHome, APPDATA: requestHome, LOCALAPPDATA: requestHome };
}

/** 差分と実認証を渡す前に、同じ実行経路をローカルの応答だけで検証する。 */
async function verifyTextOnlyCli(command: string, options: {
  model: string; cwd: string; schemaPath: string; catalogPath: string; features: string[];
  reasoning: CodexReasoningEffort; abortSignal?: AbortSignal; timeoutMs: number;
}): Promise<void> {
  const home = path.join(options.cwd, 'probe-auth');
  const outputPath = path.join(options.cwd, 'probe-output.json');
  await fs.promises.mkdir(home, { mode: 0o700 });
  await fs.promises.writeFile(path.join(home, 'auth.json'), JSON.stringify({ OPENAI_API_KEY: 'sk-commit-maker-offline-probe' }), { mode: 0o600 });
  const message = randomBytes(32).toString('hex');
  const transport = await startCodexTransport(options.abortSignal, message);
  try {
    const args = buildCodexExecArgs({ ...options, outputPath, baseUrl: transport.baseUrl });
    const result = await runCodexExec(command, args, buildCodexPrompt('Return the transport fixture message.'), {
      codexHome: home, requestHome: options.cwd, timeoutMs: options.timeoutMs, abortSignal: options.abortSignal
    });
    if (result.code !== 0 || !transport.completed || parseCodexOutput(await readOutputFile(outputPath, result.stdout)) !== message) {
      throw new Error('Codex CLI failed the offline text-only compatibility check. Update Codex CLI or Commit Maker.');
    }
  } finally { await transport.dispose(); }
}
