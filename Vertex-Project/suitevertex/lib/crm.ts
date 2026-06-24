export type ContactInput = { name: string; email: string; company?: string; message: string; plan?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(data: unknown): { ok: true; value: ContactInput } | { ok: false; error: string } {
  if (typeof data !== "object" || data === null) return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  const name = typeof d.name === "string" ? d.name.trim() : "";
  const email = typeof d.email === "string" ? d.email.trim() : "";
  const message = typeof d.message === "string" ? d.message.trim() : "";
  if (!name) return { ok: false, error: "Name is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Valid email is required" };
  return {
    ok: true,
    value: {
      name,
      email,
      message,
      company: typeof d.company === "string" ? d.company.trim() : undefined,
      plan: typeof d.plan === "string" ? d.plan : undefined,
    },
  };
}

export async function submitLead(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = process.env.VERTEX_CRM_URL;
  const key = process.env.VERTEX_CRM_API_KEY;
  if (!url || !key) return { ok: false, error: "CRM not configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        source: "suitevertex",
        name: input.name,
        email: input.email,
        company: input.company,
        message: input.message,
        planInterest: input.plan,
      }),
    });
    if (!res.ok) return { ok: false, error: `CRM responded ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error reaching CRM" };
  }
}
