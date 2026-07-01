import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidIsraeliPhone, normalizePhone } from "@/lib/validation";
import { getDepartmentById } from "@/lib/departments";

export async function POST(req: NextRequest) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { phone, code } = body;
  if (!phone || !code || !isValidIsraeliPhone(phone)) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("phone", normalizePhone(phone))
    .eq("code", code.trim().toUpperCase())
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", existing.id)
    .eq("status", "confirmed");

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  const department = await getDepartmentById(existing.department_id);

  return NextResponse.json({
    success: true,
    appointment: {
      departmentName: department?.name ?? "",
      date: existing.appointment_date,
      time: String(existing.start_time).slice(0, 5),
    },
  });
}
