import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
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
  const transport = await startCodexTransport(abortSignal);
  try {
    await writeTextOnlyCatalog(codexCommand, codexHome, model, catalogPath, abortSignal);
    await fs.promises.writeFile(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA), 'utf8');
    const args = buildCodexExecArgs({ model, outputPath, schemaPath, cwd: tempDir, reasoning, catalogPath, baseUrl: transport.baseUrl });
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
    const output = await readOutputFile(outputPath, result.stdout);
    const parsed = parseCodexOutput(output);
    if (!parsed.trim()) {
      throw new Error('Codex response was empty.');
    }
    return parsed;
  } finally {
    await transport.dispose();
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
  baseUrl
}: {
  model: string;
  outputPath: string;
  schemaPath: string;
  cwd: string;
  reasoning?: CodexReasoningEffort;
  catalogPath?: string;
  baseUrl?: string;
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
  for (const key of TEXT_ONLY_FEATURES) args.push('-c', `features.${key}=false`);
  for (const value of ['agents.enabled=false', 'tools.update_plan.enabled=false', 'tools.experimental_request_user_input.enabled=false', 'skills.bundled.enabled=false', 'skills.include_instructions=false', 'cloud.skills.enabled=false', 'token_budget.enabled=false', 'token_budget.use_history_notes_extension=false']) args.push('-c', value);
  if (catalogPath) args.push('-c', `model_catalog_json=${JSON.stringify(catalogPath)}`);
  if (baseUrl) args.push('-c', `openai_base_url=${JSON.stringify(baseUrl)}`);
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
      env: { ...buildCodexEnvironment(options.codexHome), HOME: options.requestHome, USERPROFILE: options.requestHome, APPDATA: options.requestHome, LOCALAPPDATA: options.requestHome }
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

// このCLI版の登録条件を確認したうえで、モデルカタログと送信時検査を併用する。
const TEXT_ONLY_FEATURES = [
  'shell_tool', 'view_image', 'apps', 'plugins', 'image_generation', 'goals', 'memories',
  'multi_agent', 'multi_agent_v2', 'code_mode', 'code_mode_only', 'hooks', 'token_budget',
  'skill_search', 'executor_capability_discovery', 'executor_capability_discovery_v2',
  'tool_suggest', 'sleep_tool', 'request_permissions_tool', 'send_message_to_user_async',
  'deferred_executor', 'multi_env_copy_file', 'agent_message_board', 'responses_websockets',
  'responses_websockets_v2', 'enable_request_compression'
];

async function writeTextOnlyCatalog(command: string, codexHome: string | undefined, model: string, file: string, signal?: AbortSignal): Promise<void> {
  const run = promisify(execFile);
  const options = { env: buildCodexEnvironment(codexHome), signal, timeout: 10000, maxBuffer: 4 * 1024 * 1024 };
  const version = await run(command, ['--version'], options);
  if (version.stdout.trim() !== 'codex-cli 0.164.0') throw new Error('Commit Maker requires verified Codex CLI 0.164.0 for text-only generation.');
  const bundled = await run(command, ['debug', 'models', '--bundled'], options);
  const catalog = asRecord(JSON.parse(bundled.stdout));
  const entries = Array.isArray(catalog.models) ? catalog.models : [];
  const base = asRecord(entries.find(item => asRecord(item).slug === model) ?? entries.find(item => asRecord(item).slug === 'gpt-6-luna'));
  if (!base.slug) throw new Error('Codex model metadata is missing.');
  const textOnly = { ...base, slug: model, display_name: model, shell_type: 'disabled', apply_patch_tool_type: null,
    experimental_supported_tools: [], tool_mode: 'direct', multi_agent_version: 'disabled',
    supports_search_tool: false, input_modalities: ['text'], node_repl_disabled: true,
    model_messages: null, use_responses_lite: false, base_instructions: 'Generate only the requested commit message. No tools are available.' };
  await fs.promises.writeFile(file, JSON.stringify({ models: [textOnly] }), { mode: 0o600 });
}
