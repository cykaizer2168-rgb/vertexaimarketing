import { it, expect, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "testproj");
vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");

const fetchMock = vi.fn();
vi.mock("./client", () => ({ client: { fetch: (...a: unknown[]) => fetchMock(...a) } }));

it("sanityFetch passes query and params to the client and returns data", async () => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue([{ _id: "1" }]);
  const { sanityFetch } = await import("./fetch");
  const result = await sanityFetch<{ _id: string }[]>({ query: "Q", params: { slug: "x" }, tags: ["post"] });
  expect(result).toEqual([{ _id: "1" }]);
  expect(fetchMock).toHaveBeenCalledWith("Q", { slug: "x" }, expect.objectContaining({ next: { tags: ["post"] } }));
});

// Non-production resilience: when Sanity is unreachable, list queries fall back to [].
it("sanityFetch returns [] for a failing list query (non-production)", async () => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(() => { throw new Error("getaddrinfo ENOTFOUND dummy.api.sanity.io"); });
  const { sanityFetch } = await import("./fetch");
  const result = await sanityFetch<unknown[]>({ query: `*[_type == "post"]|order(order asc){_id}`, tags: ["post"] });
  expect(result).toEqual([]);
});

// Single-document queries (those using `[0]`) fall back to null so notFound() triggers.
it("sanityFetch returns null for a failing single-document ([0]) query (non-production)", async () => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(() => { throw new Error("unreachable"); });
  const { sanityFetch } = await import("./fetch");
  const result = await sanityFetch<{ _id: string } | null>({ query: `*[_type == "post" && slug.current == $slug][0]{_id}`, params: { slug: "x" }, tags: ["post"] });
  expect(result).toBeNull();
});
