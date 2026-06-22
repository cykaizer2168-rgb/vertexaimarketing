import { client } from "./client";

export async function sanityFetch<T>({ query, params = {}, tags }: { query: string; params?: Record<string, unknown>; tags: string[] }): Promise<T> {
  return client.fetch<T>(query, params, { next: { tags } });
}
