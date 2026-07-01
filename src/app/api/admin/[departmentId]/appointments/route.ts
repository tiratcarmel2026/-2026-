import { NextRequest, NextResponse } from "next/server";
import { cookieNameForDepartment, verifyAdminToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const { departmentId } = await params;
  const token = req.cookies.get(cookieNameForDepartment(departmentId))?.value;

  if (!verifyAdminToken(token, departmentId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("appointments")
    .select("id, appointment_date, start_time, name, phone, email, reason, code, confirmed_at")
    .eq("department_id", departmentId)
    .eq("status", "confirmed")
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1000);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ appointments: data ?? [] });
}
