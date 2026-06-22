import { client } from "./client";

export async function sanityFetch<T>({ query, params = {}, tags }: { query: string; params?: Record<string, unknown>; tags: string[] }): Promise<T> {
  try {
    return await client.fetch<T>(query, params, { next: { tags } });
  } catch (error) {
    // Development-only resilience: when Sanity is unreachable (e.g. a placeholder
    // project id, no network), return an empty result so pages render their shell
    // instead of crashing with a 500. Single-document queries (those using `[0]`)
    // return null; list queries return []. Production rethrows — real fetch errors
    // must not be silently swallowed.
    if (process.env.NODE_ENV !== "production") {
      const empty = query.includes("[0]") ? null : [];
      console.warn(`[sanityFetch] dev fallback (empty result) — Sanity unreachable: ${(error as Error).message}`);
      return empty as T;
    }
    throw error;
  }
}
