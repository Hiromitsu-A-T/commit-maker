import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { buildCodexEnvironment } from '../codexCli';
import { limitOutputTokens, limitTimeout, limitContext, limitThreads, limitGpuLayers, limitKeepAlive } from '../../resourceLimits';
import * as path from 'path';
import * as vscode from 'vscode';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import {
  DEFAULT_LOCAL_CONTEXT_SIZE,
  DEFAULT_LOCAL_GPU_LAYERS,
  DEFAULT_LOCAL_KEEP_ALIVE_MS,
  DEFAULT_MAX_OUTPUT_TOKENS
} from '../../constants';
import { getStrings, DEFAULT_LANGUAGE } from '../../i18n/strings';
import { LocalModelGenerationSettings } from '../../types';
import { asRecord, createAbortController, postJsonWithBackoff } from './shared';
import { findBundledRuntime } from '../localRuntime';

const LOCAL_SYSTEM_PROMPT = [
  'Return only the final commit message.',
  'Use exactly one line unless the user explicitly asks for a body.',
  'For Conventional Commits, the required pattern is "<type>: <summary>". The first characters must be a valid ASCII type prefix such as feat:, fix:, chore:, docs:, refactor:, test:, ci:, build:, or perf:.',
  'Use exactly one Conventional Commit type prefix, at the very beginning only.',
  'The requested output language is mandatory; after the prefix, write natural-language text in that language even when the diff uses English identifiers.',
  'For non-Latin requested languages, use the native script of that language for natural-language text.',
  'Do not invent issue numbers, PR numbers, file names, or identifiers; include them only when they appear in the user instructions or diff.',
  'Do not copy diff lines or code snippets into the answer.',
  'Do not include explanations, markdown fences, reasoning, thinking text, or chat-template tags.'
].join(' ');

export interface LocalLlmCallParams {
  prompt: string;
  modelPath: string;
  extensionUri: vscode.Uri;
  runtimePath?: string;
  abortSignal?: AbortSignal;
  timeoutMs: number;
  maxOutputTokens?: number;
  contextSize?: number;
  threads?: number;
  gpuLayers?: number;
  keepAliveMs?: number;
  generation?: LocalModelGenerationSettings;
  runtimeArgs?: string[];
  logger?: (message: string) => void;
}

interface RuntimeKey {
  binaryPath: string;
  modelPath: string;
  contextSize: number;
  threads: number;
  gpuLayers: number;
  runtimeArgs: string[];
}

interface RuntimeState {
  key: RuntimeKey;
  process: ChildProcessWithoutNullStreams;
  endpoint: string;
  apiKey: string;
  stopTimer?: ReturnType<typeof setTimeout>;
}

let activeRuntime: RuntimeState | undefined;
let startingRuntime: Promise<RuntimeState> | undefined;
let startupController: AbortController | undefined;

export async function callLocalLlm({
  prompt,
  modelPath,
  extensionUri,
  runtimePath,
  abortSignal,
  timeoutMs,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  contextSize = DEFAULT_LOCAL_CONTEXT_SIZE,
  threads = 0,
  gpuLayers = DEFAULT_LOCAL_GPU_LAYERS,
  keepAliveMs = DEFAULT_LOCAL_KEEP_ALIVE_MS,
  generation,
  runtimeArgs = [],
  logger
}: LocalLlmCallParams): Promise<string> {
  maxOutputTokens = limitOutputTokens(maxOutputTokens);
  timeoutMs = limitTimeout(timeoutMs);
  contextSize = limitContext(contextSize);
  threads = limitThreads(threads);
  gpuLayers = limitGpuLayers(gpuLayers);
  keepAliveMs = limitKeepAlive(keepAliveMs);
  const strings = getStrings(DEFAULT_LANGUAGE);
  if (!fs.existsSync(modelPath)) {
    throw new Error(strings.msgLocalModelMissing);
  }

  const { controller, dispose } = createAbortController(abortSignal, timeoutMs);
  let runtime: RuntimeState | undefined;
  try {
    controller.signal.throwIfAborted();
    const binaryPath = resolveLlamaServerPath(extensionUri, runtimePath);
    const key = { binaryPath, modelPath, contextSize, threads, gpuLayers, runtimeArgs };
    runtime = await ensureRuntime(key, controller.signal, logger);
    assertChildAlive(runtime.process);
    return await postJsonWithBackoff(
      `${runtime.endpoint}/v1/chat/completions`,
      {
        label: 'Local',
        controller,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runtime.apiKey}` },
        body: buildChatCompletionBody(prompt, maxOutputTokens, generation),
        parse: raw => {
          const data = asRecord(raw ? JSON.parse(raw) : undefined);
          const choice = asRecord(Array.isArray(data.choices) ? data.choices[0] : undefined);
          // runtime が上限で打ち切った文章は、整形しても完成した結果にはならない。
          if (choice.finish_reason === 'length') {
            throw new Error('Local: response incomplete (length).');
          }
          const text = asRecord(choice.message).content || data.content || data.response;
          const cleaned = cleanupLocalOutput(typeof text === 'string' ? text : '');
          if (!cleaned.trim()) {
            throw new Error(strings.msgLlmEmptyLocal);
          }
          return cleaned;
        }
      },
      1,
      logger
    );
  } finally {
    dispose();
    if (runtime && runtime === activeRuntime) scheduleStop(keepAliveMs);
  }
}

export function stopLocalLlmRuntime(): void {
  startupController?.abort();
  if (!activeRuntime) return;
  if (activeRuntime.stopTimer) {
    clearTimeout(activeRuntime.stopTimer);
  }
  activeRuntime.process.kill();
  activeRuntime = undefined;
}

function resolveLlamaServerPath(extensionUri: vscode.Uri, configured?: string): string {
  const explicit = configured?.trim();
  if (explicit) {
    if (fs.existsSync(explicit)) return explicit;
    throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalRuntimeMissing);
  }

  const found = findBundledRuntime(extensionUri);
  if (found) return found;
  throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalRuntimeMissing);
}

async function ensureRuntime(key: RuntimeKey, abortSignal: AbortSignal, logger?: (message: string) => void): Promise<RuntimeState> {
  // 起動完了前に次の生成が来てもサーバーを重複起動しない。
  while (startingRuntime) {
    await startingRuntime.catch(() => undefined);
    abortSignal.throwIfAborted();
  }
  abortSignal.throwIfAborted();
  if (activeRuntime && sameRuntime(activeRuntime.key, key) && !activeRuntime.process.killed && activeRuntime.process.exitCode === null && activeRuntime.process.signalCode === null) {
    if (activeRuntime.stopTimer) {
      clearTimeout(activeRuntime.stopTimer);
      activeRuntime.stopTimer = undefined;
    }
    return activeRuntime;
  }

  stopLocalLlmRuntime();
  const { controller, dispose } = createAbortController(abortSignal, 120000);
  startupController = controller;
  startingRuntime = startRuntime(key, controller.signal, logger);
  try {
    return await startingRuntime;
  } finally {
    startingRuntime = undefined;
    startupController = undefined;
    dispose();
  }
}

async function startRuntime(key: RuntimeKey, abortSignal: AbortSignal, logger?: (message: string) => void): Promise<RuntimeState> {
  const apiKey = randomBytes(32).toString('hex');
  abortSignal.throwIfAborted();
  const args = [
    '-m',
    key.modelPath,
    '--host',
    '127.0.0.1',
    '--port',
    '0',
    '-c',
    String(key.contextSize),
    '-ngl',
    String(key.gpuLayers)
  ];
  args.push(...key.runtimeArgs);
  if (key.threads > 0) {
    args.push('-t', String(key.threads));
  }

  logger?.(`Local: starting ${key.binaryPath} ${args.join(' ')}`);
  const child = spawn(key.binaryPath, args, { stdio: 'pipe', cwd: path.dirname(key.binaryPath),
    env: { ...buildCodexEnvironment(), LLAMA_API_KEY: apiKey } });
  const stderr: string[] = [];
  let spawnError: Error | undefined;
  child.once('error', error => {
    spawnError = error;
    stderr.push(error.message);
  });
  let endpoint = '';
  let startupLog = '';
  const consume = (chunk: Buffer): void => {
    const text = String(chunk).replaceAll(apiKey, '[REDACTED]').replaceAll(apiKey.slice(-4), '[REDACTED]');
    startupLog = (startupLog + String(chunk)).slice(-8192);
    const match = /server is listening on (http:\/\/127\.0\.0\.1:(\d+))/.exec(startupLog);
    if (match) {
      const port = Number(match[2]);
      if (port < 1 || port > 65535 || (endpoint && endpoint !== match[1])) {
        spawnError = new Error('Invalid Local runtime endpoint.');
      } else endpoint = match[1];
    }
    if (text.trim()) { stderr.push(text.trim().slice(-2048)); if (stderr.length > 8) stderr.shift(); }
    logger?.(`Local: ${text.trim().slice(-2048)}`);
  };
  child.stdout.on('data', consume);
  child.stderr.on('data', consume);
  try {
    await waitForServer(() => endpoint, child, stderr, () => spawnError, abortSignal);
  } catch (error) {
    child.kill();
    abortSignal.throwIfAborted();
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalServerStartFailed.replace('{detail}', detail), { cause: error });
  }

  child.once('exit', () => {
    if (activeRuntime?.process === child) {
      activeRuntime = undefined;
    }
  });
  const runtime = { key, process: child, endpoint, apiKey };
  assertChildAlive(child);
  activeRuntime = runtime;
  return runtime;
}

function scheduleStop(keepAliveMs: number): void {
  if (!activeRuntime) return;
  if (activeRuntime.stopTimer) {
    clearTimeout(activeRuntime.stopTimer);
  }
  keepAliveMs = limitKeepAlive(keepAliveMs);
  activeRuntime.stopTimer = setTimeout(() => {
    stopLocalLlmRuntime();
  }, keepAliveMs);
}

async function waitForServer(
  getEndpoint: () => string,
  child: ChildProcessWithoutNullStreams,
  stderr: string[],
  getSpawnError: () => Error | undefined,
  abortSignal: AbortSignal
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120000) {
    abortSignal.throwIfAborted();
    const spawnError = getSpawnError();
    if (spawnError) {
      throw spawnError;
    }
    if (child.killed || child.exitCode !== null || child.signalCode !== null) {
      throw new Error(stderr.slice(-5).join('\n') || `process exited with code ${child.exitCode}`);
    }
    const endpoint = getEndpoint();
    if (endpoint && await canReachServer(endpoint, abortSignal)) {
      assertChildAlive(child);
      return;
    }
    await delay(500);
  }
  throw new Error('startup timeout');
}

async function canReachServer(endpoint: string, abortSignal: AbortSignal): Promise<boolean> {
  for (const pathName of ['/health']) {
    const { controller, dispose } = createAbortController(abortSignal, 2000);
    try {
      const res = await fetch(`${endpoint}${pathName}`, { signal: controller.signal, redirect: 'manual' });
      await res.body?.cancel();
      if (res.ok) {
        return true;
      }
    } catch {
      abortSignal.throwIfAborted();
      // 接続拒否や起動途中の応答では次の確認を続ける。
    } finally {
      dispose();
    }
  }
  return false;
}

function cleanupLocalOutput(value: string): string {
  return value
    .replace(/```(?:text|markdown)?/gi, '')
    .replace(/```/g, '')
    .replace(/<\|channel>thought[\s\S]*?<channel\|>/g, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|(?:startoftext|endoftext|im_start|im_end)\|>/g, '')
    .replace(/^\s*(?:assistant|final)\s*[:：]\s*/i, '')
    .trim();
}

function buildChatCompletionBody(
  prompt: string,
  maxOutputTokens: number,
  generation: LocalModelGenerationSettings | undefined
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: 'local',
    messages: [
      {
        role: 'system',
        content: LOCAL_SYSTEM_PROMPT
      },
      { role: 'user', content: prompt }
    ],
    temperature: generation?.temperature ?? 0,
    max_tokens: maxOutputTokens
  };
  addNumber(body, 'top_p', generation?.topP);
  addNumber(body, 'top_k', generation?.topK);
  addNumber(body, 'min_p', generation?.minP);
  addNumber(body, 'repeat_penalty', generation?.repeatPenalty);
  addNumber(body, 'presence_penalty', generation?.presencePenalty);
  if (generation?.reasoningFormat) {
    body.reasoning_format = generation.reasoningFormat;
  }
  if (generation?.chatTemplateKwargs) {
    body.chat_template_kwargs = generation.chatTemplateKwargs;
  }
  return body;
}

function addNumber(body: Record<string, unknown>, key: string, value: number | undefined): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    body[key] = value;
  }
}

function sameRuntime(a: RuntimeKey, b: RuntimeKey): boolean {
  return (
    a.binaryPath === b.binaryPath &&
    a.modelPath === b.modelPath &&
    a.contextSize === b.contextSize &&
    a.threads === b.threads &&
    a.gpuLayers === b.gpuLayers &&
    sameStringList(a.runtimeArgs, b.runtimeArgs)
  );
}

function sameStringList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function assertChildAlive(child: ChildProcessWithoutNullStreams): void {
  if (child.killed || child.exitCode !== null || child.signalCode !== null) {
    throw new Error('Local runtime is no longer running.');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
