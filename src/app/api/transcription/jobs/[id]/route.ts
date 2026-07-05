import { NextRequest, NextResponse } from "next/server";
import { isTranscriptionRequestAuthorized } from "@/lib/transcription/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from("transcription_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ job: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: job } = await supabase
    .from("transcription_jobs")
    .select("storage_bucket, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (job) {
    await supabase.storage.from(job.storage_bucket).remove([job.storage_path]);
  }

  const { error } = await supabase.from("transcription_jobs").delete().eq("id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
