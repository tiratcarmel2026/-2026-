import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isTranscriptionRequestAuthorized } from "@/lib/transcription/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const RECORDINGS_BUCKET = "recordings";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-֐-׿ ]/g, "_").slice(-150) || "recording";
}

export async function GET(req: NextRequest) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("transcription_jobs")
    .select(
      "id, original_filename, status, progress_stage, progress_percent, error_message, duration_seconds, speaker_names, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (!body.filename) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const jobId = randomUUID();
  const storagePath = `${jobId}/${sanitizeFilename(body.filename)}`;
  const supabase = getSupabaseAdmin();

  const { error: insertError } = await supabase.from("transcription_jobs").insert({
    id: jobId,
    original_filename: body.filename,
    storage_bucket: RECORDINGS_BUCKET,
    storage_path: storagePath,
    status: "pending_upload",
  });

  if (insertError) {
    console.error(insertError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signError || !signed) {
    console.error(signError);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({
    jobId,
    bucket: RECORDINGS_BUCKET,
    path: signed.path,
    token: signed.token,
  });
}
