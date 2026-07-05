import { NextRequest, NextResponse } from "next/server";
import { isTranscriptionRequestAuthorized } from "@/lib/transcription/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Called by the browser once the file finished uploading directly to
// Supabase Storage. Flips the job from 'pending_upload' to 'pending' so the
// transcription worker picks it up.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from("transcription_jobs")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending_upload")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
