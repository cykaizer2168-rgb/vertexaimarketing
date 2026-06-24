import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateContact, submitLead } from "./crm";

describe("validateContact", () => {
  it("rejects missing email", () => {
    expect(validateContact({ name: "A", mobile: "0917" }).ok).toBe(false);
  });
  it("rejects missing mobile", () => {
    expect(validateContact({ name: "A", email: "a@b.com" }).ok).toBe(false);
  });
  it("accepts valid input", () => {
    expect(validateContact({ name: "A", email: "a@b.com", mobile: "0917" }).ok).toBe(true);
  });
});

describe("submitLead", () => {
  beforeEach(() => {
    vi.stubEnv("VERTEX_CRM_URL", "https://crm.example/api/leads");
  });
  it("posts name/mobile/email + tagged message to the CRM", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const r = await submitLead({ name: "A", email: "a@b.com", mobile: "0917", message: "hi", company: "Acme" });
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://crm.example/api/leads", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ name: "A", mobile: "0917", email: "a@b.com" });
    expect(body.message).toContain("SuiteVertex");
    expect(body.message).toContain("Acme");
  });
  it("returns error when CRM responds non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    expect((await submitLead({ name: "A", email: "a@b.com", mobile: "0917" })).ok).toBe(false);
  });
});
