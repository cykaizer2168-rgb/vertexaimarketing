import { describe, it, expect, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "testproj");
vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");

describe("urlFor", () => {
  it("builds a cdn url for an image ref", async () => {
    const { urlFor } = await import("./image");
    const url = urlFor({ asset: { _ref: "image-abc123-200x200-png" } }).width(100).url();
    expect(url).toContain("cdn.sanity.io");
    expect(url).toContain("testproj");
  });
});
