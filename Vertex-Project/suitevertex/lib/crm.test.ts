import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateContact, submitLead } from "./crm";

describe("validateContact", () => {
  it("rejects missing email", () => {
    const r = validateContact({ name: "A", message: "hi" });
    expect(r.ok).toBe(false);
  });
  it("accepts valid input", () => {
    const r = validateContact({ name: "A", email: "a@b.com", message: "hi" });
    expect(r.ok).toBe(true);
  });
});

describe("submitLead", () => {
  beforeEach(() => {
    vi.stubEnv("VERTEX_CRM_URL", "https://crm.example/leads");
    vi.stubEnv("VERTEX_CRM_API_KEY", "secret");
  });
  it("posts the lead with auth header and source", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const r = await submitLead({ name: "A", email: "a@b.com", message: "hi", company: "Acme" });
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://crm.example/leads", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer secret", "Content-Type": "application/json" }),
    }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ source: "suitevertex", name: "A", email: "a@b.com", company: "Acme" });
  });
  it("returns error when CRM responds non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const r = await submitLead({ name: "A", email: "a@b.com", message: "hi" });
    expect(r.ok).toBe(false);
  });
});
