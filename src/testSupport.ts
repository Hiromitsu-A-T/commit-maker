/** fetch を差し替える範囲をテスト一件に限定し、成功・失敗のどちらでも元へ戻す。 */
export async function withMockFetch<T>(mock: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = global.fetch;
  global.fetch = mock;
  try {
    return await run();
  } finally {
    global.fetch = original;
  }
}
