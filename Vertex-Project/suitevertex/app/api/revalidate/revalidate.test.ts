import { describe, it, expect, vi, beforeEach } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (t: string) => revalidateTag(t) }));
vi.mock("next/server", () => ({ NextResponse: { json: (b: unknown, i?: unknown) => ({ body: b, init: i }) } }));

describe("revalidate route", () => {
  beforeEach(() => { revalidateTag.mockReset(); vi.stubEnv("SANITY_REVALIDATE_SECRET", "shh"); });

  it("rejects a bad secret", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://x/api/revalidate?secret=wrong", { method: "POST", body: JSON.stringify({ _type: "post" }) });
    const res = await POST(req) as unknown as { body: unknown; init?: { status: number } };
    expect(res.init?.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the document type tag on valid secret", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://x/api/revalidate?secret=shh", { method: "POST", body: JSON.stringify({ _type: "post" }) });
    await POST(req);
    expect(revalidateTag).toHaveBeenCalledWith("post");
  });
});
