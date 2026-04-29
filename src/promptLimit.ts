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
