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

  if (!body.name || !body.stream_url) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("camera_feeds")
    .insert({
      name: body.name,
      location: body.location ?? null,
      stream_url: body.stream_url,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      active: body.active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ camera: data });
}
