import { NextRequest, NextResponse } from "next/server";
import { getDepartmentById } from "@/lib/departments";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateCancellationCode } from "@/lib/code";
import { isValidEmail, isValidIsraeliPhone, normalizePhone } from "@/lib/validation";
import { sendBookingConfirmationEmails } from "@/lib/email";
import type { Appointment } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: {
    holderId?: string;
    name?: string;
    phone?: string;
    email?: string;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { holderId, name, phone, email, reason } = body;

  if (
    !holderId ||
    !name?.trim() ||
    !phone ||
    !email ||
    !reason?.trim() ||
    !isValidIsraeliPhone(phone) ||
    !isValidEmail(email)
  ) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("holder_id", holderId)
    .eq("status", "held")
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "HOLD_NOT_FOUND" }, { status: 404 });
  }

  if (new Date(existing.expires_at).getTime() < Date.now()) {
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", existing.id)
      .eq("status", "held");
    return NextResponse.json({ error: "HOLD_EXPIRED" }, { status: 410 });
  }

  const department = await getDepartmentById(existing.department_id);
  if (!department) {
    return NextResponse.json({ error: "DEPARTMENT_NOT_FOUND" }, { status: 404 });
  }

  const code = generateCancellationCode();

  const { data: updated, error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "confirmed",
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email.trim(),
      reason: reason.trim(),
      code,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("status", "held")
    .select()
    .single();

  if (updateError || !updated) {
    console.error(updateError);
    return NextResponse.json({ error: "HOLD_EXPIRED" }, { status: 410 });
  }

  const appointment = updated as Appointment;
  await sendBookingConfirmationEmails(department, appointment);

  return NextResponse.json({
    success: true,
    appointment: {
      departmentName: department.name,
      date: appointment.appointment_date,
      time: appointment.start_time.slice(0, 5),
      code: appointment.code,
    },
  });
}
