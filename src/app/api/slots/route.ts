import { NextRequest, NextResponse } from "next/server";
import { getDepartmentById } from "@/lib/departments";
import { getSlotTimesForDate, isValidDateString } from "@/lib/slots";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const departmentId = req.nextUrl.searchParams.get("departmentId");
  const date = req.nextUrl.searchParams.get("date");

  if (!departmentId || !date || !isValidDateString(date)) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const department = await getDepartmentById(departmentId);
  if (!department) {
    return NextResponse.json({ error: "DEPARTMENT_NOT_FOUND" }, { status: 404 });
  }

  const allTimes = getSlotTimesForDate(department, date);
  if (allTimes.length === 0) {
    return NextResponse.json({ date, departmentId, slots: [] });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("appointments")
    .select("start_time")
    .eq("department_id", departmentId)
    .eq("appointment_date", date)
    .or(`status.eq.confirmed,and(status.eq.held,expires_at.gt.${nowIso})`);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  const taken = new Set((data ?? []).map((row) => String(row.start_time).slice(0, 5)));
  const slots = allTimes.map((time) => ({ time, available: !taken.has(time) }));

  return NextResponse.json({ date, departmentId, slots });
}
