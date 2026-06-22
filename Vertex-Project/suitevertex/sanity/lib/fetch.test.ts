import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "testproj");
vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");

const fetchMock = vi.fn();
vi.mock("./client", () => ({ client: { fetch: (...a: unknown[]) => fetchMock(...a) } }));

describe("sanityFetch", () => {
  beforeEach(() => fetchMock.mockReset());
  it("passes query and params to the client and returns data", async () => {
    fetchMock.mockResolvedValue([{ _id: "1" }]);
    const { sanityFetch } = await import("./fetch");
    const result = await sanityFetch<{ _id: string }[]>({ query: "Q", params: { slug: "x" }, tags: ["post"] });
    expect(result).toEqual([{ _id: "1" }]);
    expect(fetchMock).toHaveBeenCalledWith("Q", { slug: "x" }, expect.objectContaining({ next: { tags: ["post"] } }));
  });
});
