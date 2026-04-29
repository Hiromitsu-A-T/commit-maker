import * as fs from 'fs';
import * as net from 'net';
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
import { createAbortController, postJsonWithBackoff } from './shared';
import { findBundledRuntime } from '../localRuntime';

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
  logger?: (message: string) => void;
}

interface RuntimeKey {
  binaryPath: string;
  modelPath: string;
  contextSize: number;
  threads: number;
  gpuLayers: number;
}

interface RuntimeState {
  key: RuntimeKey;
  process: ChildProcessWithoutNullStreams;
  endpoint: string;
  stopTimer?: ReturnType<typeof setTimeout>;
}

let activeRuntime: RuntimeState | undefined;

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
  logger
}: LocalLlmCallParams): Promise<string> {
  const strings = getStrings(DEFAULT_LANGUAGE);
  if (!fs.existsSync(modelPath)) {
    throw new Error(strings.msgLocalModelMissing);
  }

  const binaryPath = resolveLlamaServerPath(extensionUri, runtimePath);
  const key = { binaryPath, modelPath, contextSize, threads, gpuLayers };
  const runtime = await ensureRuntime(key, logger);

  const { controller, dispose } = createAbortController(abortSignal, timeoutMs);
  try {
    return await postJsonWithBackoff(
      `${runtime.endpoint}/v1/chat/completions`,
      {
        label: 'Local',
        controller,
        headers: { 'Content-Type': 'application/json' },
        body: {
          model: 'local',
          messages: [
            {
              role: 'system',
              content: 'Return only the final commit message. Do not include explanations, markdown fences, or reasoning.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          max_tokens: maxOutputTokens
        },
        parse: raw => {
          const data = raw ? JSON.parse(raw) as any : {};
          const text = data?.choices?.[0]?.message?.content || data?.content || data?.response;
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
    scheduleStop(keepAliveMs);
  }
}

export function stopLocalLlmRuntime(): void {
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

async function ensureRuntime(key: RuntimeKey, logger?: (message: string) => void): Promise<RuntimeState> {
  if (activeRuntime && sameRuntime(activeRuntime.key, key) && !activeRuntime.process.killed) {
    if (activeRuntime.stopTimer) {
      clearTimeout(activeRuntime.stopTimer);
      activeRuntime.stopTimer = undefined;
    }
    return activeRuntime;
  }

  stopLocalLlmRuntime();
  const port = await getFreePort();
  const args = [
    '-m',
    key.modelPath,
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '-c',
    String(key.contextSize),
    '-ngl',
    String(key.gpuLayers)
  ];
  if (key.threads > 0) {
    args.push('-t', String(key.threads));
  }

  logger?.(`Local: starting ${key.binaryPath} ${args.join(' ')}`);
  const child = spawn(key.binaryPath, args, { stdio: 'pipe', cwd: path.dirname(key.binaryPath) });
  const stderr: string[] = [];
  let spawnError: Error | undefined;
  child.once('error', error => {
    spawnError = error;
    stderr.push(error.message);
  });
  child.stdout.on('data', chunk => logger?.(`Local: ${String(chunk).trim()}`));
  child.stderr.on('data', chunk => {
    const text = String(chunk).trim();
    if (text) {
      stderr.push(text);
      logger?.(`Local: ${text}`);
    }
  });

  const endpoint = `http://127.0.0.1:${port}`;
  const runtime = { key, process: child, endpoint };
  try {
    await waitForServer(endpoint, child, stderr, () => spawnError);
  } catch (error) {
    child.kill();
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalServerStartFailed.replace('{detail}', detail));
  }

  child.once('exit', () => {
    if (activeRuntime?.process === child) {
      activeRuntime = undefined;
    }
  });
  activeRuntime = runtime;
  return runtime;
}

function scheduleStop(keepAliveMs: number): void {
  if (!activeRuntime) return;
  if (activeRuntime.stopTimer) {
    clearTimeout(activeRuntime.stopTimer);
  }
  if (keepAliveMs <= 0) return;
  activeRuntime.stopTimer = setTimeout(() => {
    stopLocalLlmRuntime();
  }, keepAliveMs);
}

async function waitForServer(
  endpoint: string,
  child: ChildProcessWithoutNullStreams,
  stderr: string[],
  getSpawnError: () => Error | undefined
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120000) {
    const spawnError = getSpawnError();
    if (spawnError) {
      throw spawnError;
    }
    if (child.exitCode !== null) {
      throw new Error(stderr.slice(-5).join('\n') || `process exited with code ${child.exitCode}`);
    }
    if (await canReachServer(endpoint)) {
      return;
    }
    await delay(500);
  }
  throw new Error('startup timeout');
}

async function canReachServer(endpoint: string): Promise<boolean> {
  for (const pathName of ['/health', '/v1/models']) {
    try {
      const res = await fetch(`${endpoint}${pathName}`);
      if (res.ok) {
        return true;
      }
    } catch {
      // Server is still starting.
    }
  }
  return false;
}

function cleanupLocalOutput(value: string): string {
  return value
    .replace(/```(?:text|markdown)?/gi, '')
    .replace(/```/g, '')
    .replace(/<\|channel\>thought[\s\S]*?<channel\|>/g, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

function sameRuntime(a: RuntimeKey, b: RuntimeKey): boolean {
  return (
    a.binaryPath === b.binaryPath &&
    a.modelPath === b.modelPath &&
    a.contextSize === b.contextSize &&
    a.threads === b.threads &&
    a.gpuLayers === b.gpuLayers
  );
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') resolve(address.port);
        else reject(new Error('failed to allocate port'));
      });
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
