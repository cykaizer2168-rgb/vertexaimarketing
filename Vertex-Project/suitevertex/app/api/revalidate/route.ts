import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }
  let body: { _type?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  if (!body._type) return NextResponse.json({ ok: false, error: "Missing _type" }, { status: 400 });
  revalidateTag(body._type);
  return NextResponse.json({ ok: true, revalidated: body._type });
}
