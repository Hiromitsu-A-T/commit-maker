import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import { CodexReasoningEffort } from '../../types';
import { sanitizeLlmErrorText } from './shared';
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
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-codex-'));
  const outputPath = path.join(tempDir, 'last-message.json');
  const schemaPath = path.join(tempDir, 'schema.json');
  try {
    await fs.promises.writeFile(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA), 'utf8');
    const args = buildCodexExecArgs({ model, outputPath, schemaPath, cwd: tempDir, reasoning });
    logger?.(`Codex: ${codexCommand} ${args.map(quoteArgForLog).join(' ')}`);
    const result = await runCodexExec(codexCommand, args, buildCodexPrompt(prompt), {
      abortSignal,
      codexHome,
      timeoutMs
    });
    if (result.code !== 0) {
      const detail = sanitizeLlmErrorText(result.stderr || result.stdout || `exit code ${result.code}`);
      throw new Error(`Codex execution failed: ${detail}`);
    }
    const output = await readOutputFile(outputPath, result.stdout);
    const parsed = parseCodexOutput(output);
    if (!parsed.trim()) {
      throw new Error('Codex response was empty.');
    }
    return parsed;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function buildCodexExecArgs({
  model,
  outputPath,
  schemaPath,
  cwd,
  reasoning = 'low'
}: {
  model: string;
  outputPath: string;
  schemaPath: string;
  cwd: string;
  reasoning?: CodexReasoningEffort;
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
    const data = JSON.parse(text) as { message?: unknown };
    if (typeof data.message === 'string') {
      return cleanupCommitMessage(data.message);
    }
  } catch {
    // Some older Codex versions may return plain text even with an output schema.
  }
  return cleanupCommitMessage(text);
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
    // Fall back to stdout when Codex did not create the last-message file.
  }
  return fallback;
}

function runCodexExec(
  command: string,
  args: string[],
  stdin: string,
  options: { abortSignal?: AbortSignal; codexHome?: string; timeoutMs: number }
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: buildCodexEnvironment(options.codexHome)
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
