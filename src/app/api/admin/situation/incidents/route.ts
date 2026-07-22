import { NextRequest, NextResponse } from "next/server";
import { isSituationAdminRequest } from "@/lib/situationAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  if (!isSituationAdminRequest(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "MISSING_TITLE" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("incidents")
    .insert({
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "active",
      severity: body.severity ?? "medium",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      address: body.address ?? null,
      fatalities_count: body.fatalities_count ?? 0,
      injured_count: body.injured_count ?? 0,
      needs: body.needs ?? null,
      created_by: body.created_by ?? null,
      updated_by: body.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ incident: data });
}
