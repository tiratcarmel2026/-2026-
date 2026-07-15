import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/validation";
import { sendYizkorContactEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message || !isValidEmail(email)) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  if (name.length > 200 || email.length > 200 || phone.length > 50 || message.length > 5000) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  try {
    await sendYizkorContactEmail({ name, email, phone, message });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_NOT_CONFIGURED") {
      console.warn("[yizkor-contact] RESEND_API_KEY / RESEND_FROM_EMAIL not configured");
      return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error("[yizkor-contact] Failed to send email", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
