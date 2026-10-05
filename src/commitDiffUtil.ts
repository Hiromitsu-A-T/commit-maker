export function parseUntrackedPaths(statusOutput: string): string[] {
  // -z のパスは引用やエスケープがなく、空白・改行もそのまま保持される。
  const separator = statusOutput.includes('\0') ? '\0' : '\n';
  return statusOutput
    .split(separator)
    .filter(line => line.startsWith('?? '))
    .map(line => line.slice(3))
    .filter(Boolean);
}
