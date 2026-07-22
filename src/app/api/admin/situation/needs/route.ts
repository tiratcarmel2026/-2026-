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
    .from("resource_needs")
    .insert({
      title: body.title,
      quantity: body.quantity ?? null,
      status: body.status ?? "needed",
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ need: data });
}
