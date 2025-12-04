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
