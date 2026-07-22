const INLINE_JSON_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};

export function serializeForInlineScript(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) return 'null';
  return json.replace(/[<>&\u2028\u2029]/g, character => INLINE_JSON_ESCAPES[character] ?? character);
}
