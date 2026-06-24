export type ContactInput = {
  name: string;
  email: string;
  mobile: string;
  company?: string;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(data: unknown): { ok: true; value: ContactInput } | { ok: false; error: string } {
  if (typeof data !== "object" || data === null) return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  const name = typeof d.name === "string" ? d.name.trim() : "";
  const email = typeof d.email === "string" ? d.email.trim() : "";
  const mobile = typeof d.mobile === "string" ? d.mobile.trim() : "";
  const company = typeof d.company === "string" ? d.company.trim() : "";
  const message = typeof d.message === "string" ? d.message.trim() : "";
  if (!name) return { ok: false, error: "Name is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Valid email is required" };
  if (!mobile) return { ok: false, error: "Phone number is required" };
  return {
    ok: true,
    value: { name, email, mobile, company: company || undefined, message: message || undefined },
  };
}

// Posts to the Vertex CRM (vertexai-crm) public lead intake: POST {VERTEX_CRM_URL}
// expects { name, mobile, email, message } (keyless) and returns { success: true }.
export async function submitLead(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = process.env.VERTEX_CRM_URL;
  if (!url) return { ok: false, error: "CRM not configured" };

  // Tag the lead as SuiteVertex and fold company into the message (CRM has no company field).
  const parts = ["[SuiteVertex lead]"];
  if (input.company) parts.push(`Company: ${input.company}`);
  if (input.message) parts.push(input.message);
  const message = parts.join(" — ");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.name, mobile: input.mobile, email: input.email, message }),
    });
    const body = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!res.ok || !body.success) return { ok: false, error: body.error || `CRM responded ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error reaching CRM" };
  }
}
