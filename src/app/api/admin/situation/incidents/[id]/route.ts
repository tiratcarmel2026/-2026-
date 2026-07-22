import { NextRequest, NextResponse } from "next/server";
import { isSituationAdminRequest } from "@/lib/situationAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const EDITABLE_FIELDS = [
  "title",
  "description",
  "status",
  "severity",
  "lat",
  "lng",
  "address",
  "fatalities_count",
  "injured_count",
  "needs",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSituationAdminRequest(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

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
  update.updated_at = new Date().toISOString();
  update.updated_by = body.updated_by ?? null;

  const { data, error } = await getSupabaseAdmin()
    .from("incidents")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ incident: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSituationAdminRequest(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  const { error } = await getSupabaseAdmin().from("incidents").delete().eq("id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
