import { NextResponse } from "next/server";
import { validateContact, submitLead } from "@/lib/crm";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  // Honeypot: bots fill hidden "website" field.
  if (json && typeof json === "object" && (json as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true });
  }
  const parsed = validateContact(json);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const result = await submitLead(parsed.value);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
