export function applyPromptLimit(
  diff: string,
  mode: 'unlimited' | 'limited',
  maxChars: number | null | undefined
): string {
  if (mode !== 'limited') return diff;
  const limit = maxChars ?? 0;
  if (!limit || limit <= 0 || diff.length <= limit) return diff;
  const head = diff.slice(0, Math.floor(limit * 0.2));
  const tail = diff.slice(-Math.floor(limit * 0.8));
  return `${head}\n\n[...${diff.length - limit} chars omitted...]\n\n${tail}`;
}

export function getLocalPromptCharLimit(contextSize: number, maxOutputTokens: number): number {
  const safeContext = Number.isFinite(contextSize) && contextSize > 0 ? contextSize : 32768;
  const safeOutput = Number.isFinite(maxOutputTokens) && maxOutputTokens > 0 ? maxOutputTokens : 2048;
  const promptTokenBudget = Math.max(4096, safeContext - safeOutput - 4096);
  const estimatedCharBudget = Math.floor(promptTokenBudget * 1.2);
  return Math.max(16000, Math.min(96000, estimatedCharBudget));
}

export function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const limit = Math.max(1000, Math.floor(maxChars));
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + limit);
    if (end < text.length) {
      const minBoundary = start + Math.floor(limit * 0.5);
      const diffBoundary = text.lastIndexOf('\ndiff --git ', end);
      const hunkBoundary = text.lastIndexOf('\n@@ ', end);
      const blankBoundary = text.lastIndexOf('\n\n', end);
      const lineBoundary = text.lastIndexOf('\n', end);
      const boundary = [diffBoundary, hunkBoundary, blankBoundary, lineBoundary]
        .find(candidate => candidate > minBoundary);
      if (boundary && boundary > start) {
        end = boundary;
      }
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

interface DiffFileDigest {
  path: string;
  additions: number;
  deletions: number;
  metadata: string[];
  hunks: string[];
  addedSamples: string[];
  deletedSamples: string[];
}

export function buildLocalDiffDigest(diff: string, maxChars = 16000): string {
  const files = collectFileDigests(diff);
  if (!files.length) {
    return diff.length <= maxChars ? diff : truncateDigest(diff, maxChars);
  }

  for (const sampleLimit of [6, 3, 1, 0]) {
    const rendered = renderDiffDigest(diff.length, files, sampleLimit);
    if (rendered.length <= maxChars || sampleLimit === 0) {
      return rendered.length <= maxChars ? rendered : truncateDigest(rendered, maxChars);
    }
  }
  return truncateDigest(renderDiffDigest(diff.length, files, 0), maxChars);
}

function collectFileDigests(diff: string): DiffFileDigest[] {
  const files: DiffFileDigest[] = [];
  let current: DiffFileDigest | undefined;

  const startFile = (filePath: string): DiffFileDigest => {
    const file = {
      path: filePath || '(unknown)',
      additions: 0,
      deletions: 0,
      metadata: [],
      hunks: [],
      addedSamples: [],
      deletedSamples: []
    };
    files.push(file);
    current = file;
    return file;
  };

  for (const line of diff.split(/\r?\n/)) {
    const gitMatch = /^diff --git\s+a\/(.+?)\s+b\/(.+)$/.exec(line);
    if (gitMatch) {
      startFile(cleanDiffPath(gitMatch[2]));
      continue;
    }

    const untrackedMatch = /^###\s+Untracked\s+(.+)$/.exec(line);
    if (untrackedMatch) {
      const file = startFile(cleanDiffPath(untrackedMatch[1]));
      file.metadata.push('untracked file');
      continue;
    }

    if (!current) continue;
    if (line.startsWith('@@')) {
      pushLimited(current.hunks, line.trim(), 6);
      continue;
    }
    if (/^(new file mode|deleted file mode|rename from|rename to|similarity index|index )/.test(line)) {
      pushLimited(current.metadata, line.trim(), 6);
      continue;
    }
    if (line.startsWith('+++ ') || line.startsWith('--- ')) {
      continue;
    }
    if (line.startsWith('+')) {
      current.additions += 1;
      pushLimited(current.addedSamples, compactSample(line.slice(1)), 12);
      continue;
    }
    if (line.startsWith('-')) {
      current.deletions += 1;
      pushLimited(current.deletedSamples, compactSample(line.slice(1)), 12);
      continue;
    }
    if (current.metadata.includes('untracked file') && line.trim()) {
      current.additions += 1;
      pushLimited(current.addedSamples, compactSample(line), 12);
    }
  }

  return files;
}

function renderDiffDigest(originalLength: number, files: DiffFileDigest[], sampleLimit: number): string {
  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
  const lines = [
    '# Local diff digest',
    `Original diff chars: ${originalLength}`,
    `Files changed: ${files.length}`,
    `Line stats: +${totalAdditions} -${totalDeletions}`,
    '',
    'Use this digest to write the commit message. It covers every parsed file and keeps representative changed lines.'
  ];

  for (const file of files) {
    lines.push('', `## ${file.path}`, `Stats: +${file.additions} -${file.deletions}`);
    if (file.metadata.length) {
      lines.push(`Metadata: ${file.metadata.join(' | ')}`);
    }
    if (file.hunks.length) {
      lines.push(`Hunks: ${file.hunks.join(' | ')}`);
    }
    if (sampleLimit > 0 && file.addedSamples.length) {
      lines.push('Added samples:');
      for (const sample of file.addedSamples.slice(0, sampleLimit)) {
        lines.push(`+ ${sample}`);
      }
    }
    if (sampleLimit > 0 && file.deletedSamples.length) {
      lines.push('Deleted samples:');
      for (const sample of file.deletedSamples.slice(0, sampleLimit)) {
        lines.push(`- ${sample}`);
      }
    }
  }

  return lines.join('\n');
}

function cleanDiffPath(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}

function compactSample(value: string): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return '(blank line)';
  return compact.length <= 180 ? compact : compact.slice(0, 177) + '...';
}

function pushLimited(items: string[], value: string, limit: number): void {
  if (!value || items.length >= limit) return;
  items.push(value);
}

function truncateDigest(value: string, maxChars: number): string {
  const limit = Math.max(1000, Math.floor(maxChars));
  if (value.length <= limit) return value;
  const headLength = Math.floor(limit * 0.7);
  const tailLength = Math.max(200, limit - headLength - 80);
  const omitted = value.length - headLength - tailLength;
  return `${value.slice(0, headLength)}\n\n[...${omitted} digest chars omitted for local speed...]\n\n${value.slice(-tailLength)}`;
}
