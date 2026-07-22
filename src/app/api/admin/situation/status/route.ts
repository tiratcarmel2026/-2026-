import { NextRequest, NextResponse } from "next/server";
import { isSituationAdminRequest } from "@/lib/situationAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const EDITABLE_FIELDS = [
  "alert_active",
  "alert_message",
  "fatalities_count",
  "injured_severe_count",
  "injured_moderate_count",
  "injured_light_count",
  "missing_count",
  "shelters_open_count",
  "headline",
] as const;

export async function POST(req: NextRequest) {
  if (!isSituationAdminRequest(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: Record<string, unknown> & { updated_by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  if (update.alert_active === true) {
    update.alert_started_at = new Date().toISOString();
  }
  if (update.alert_active === false) {
    update.alert_started_at = null;
    update.alert_message = null;
  }
  update.updated_at = new Date().toISOString();
  update.updated_by = body.updated_by ?? null;

  const { data, error } = await getSupabaseAdmin()
    .from("situation_status")
    .update(update)
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ status: data });
}
