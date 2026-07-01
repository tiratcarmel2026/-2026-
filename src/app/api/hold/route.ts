import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDepartmentById } from "@/lib/departments";
import {
  getSlotTimesForDate,
  isValidDateString,
  isValidTimeString,
  HOLD_DURATION_MINUTES,
} from "@/lib/slots";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  let body: { departmentId?: string; date?: string; time?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { departmentId, date, time } = body;
  if (
    !departmentId ||
    !date ||
    !time ||
    !isValidDateString(date) ||
    !isValidTimeString(time)
  ) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const department = await getDepartmentById(departmentId);
  if (!department) {
    return NextResponse.json({ error: "DEPARTMENT_NOT_FOUND" }, { status: 404 });
  }

  const validTimes = getSlotTimesForDate(department, date);
  if (!validTimes.includes(time)) {
    return NextResponse.json({ error: "SLOT_NOT_AVAILABLE" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // Free up an expired hold on this exact slot (if any) before trying to take it.
  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("department_id", departmentId)
    .eq("appointment_date", date)
    .eq("start_time", `${time}:00`)
    .eq("status", "held")
    .lt("expires_at", nowIso);

  const holderId = randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60_000).toISOString();

  const { error } = await supabase.from("appointments").insert({
    department_id: departmentId,
    appointment_date: date,
    start_time: `${time}:00`,
    status: "held",
    holder_id: holderId,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({
    holderId,
    expiresAt,
    holdDurationMinutes: HOLD_DURATION_MINUTES,
  });
}
