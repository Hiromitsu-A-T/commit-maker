export function parseUntrackedPaths(statusOutput: string): string[] {
  return statusOutput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('?? '))
    .map(line => line.slice(3))
    .filter(Boolean);
}
