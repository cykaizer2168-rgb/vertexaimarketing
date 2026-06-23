import { client } from "./client";

export async function sanityFetch<T>({ query, params = {}, tags }: { query: string; params?: Record<string, unknown>; tags: string[] }): Promise<T> {
  try {
    return await client.fetch<T>(query, params, { next: { tags } });
  } catch (error) {
    // Resilience: when Sanity is unreachable (e.g. a placeholder project id while
    // no real CMS is wired yet), return an empty result so pages render their shell
    // instead of crashing with a 500. Single-document queries (those using `[0]`)
    // return null; list queries return []. The failure is logged (not silent) so
    // it stays visible in server logs / observability.
    // NOTE: once a real Sanity project is configured, consider restoring a strict
    // production rethrow so genuine outages surface as errors rather than empty pages.
    const empty = query.includes("[0]") ? null : [];
    console.warn(`[sanityFetch] empty-result fallback — Sanity unreachable: ${(error as Error).message}`);
    return empty as T;
  }
}
