import { NextRequest, NextResponse } from "next/server";
import { isTranscriptionRequestAuthorized } from "@/lib/transcription/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Rename a speaker label (e.g. "SPEAKER_00" -> "יוסי כהן") for a job. Merges
// into the existing speaker_names map so renaming one speaker doesn't clobber
// the others or any name the worker already guessed.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  let body: { speaker?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  if (!body.speaker || typeof body.name !== "string") {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: job, error: fetchError } = await supabase
    .from("transcription_jobs")
    .select("speaker_names")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const speakerNames = { ...(job.speaker_names ?? {}), [body.speaker]: body.name.trim() };

  const { error: updateError } = await supabase
    .from("transcription_jobs")
    .update({ speaker_names: speakerNames, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ speaker_names: speakerNames });
}
