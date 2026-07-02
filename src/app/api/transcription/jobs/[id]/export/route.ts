import { NextRequest, NextResponse } from "next/server";
import { isTranscriptionRequestAuthorized } from "@/lib/transcription/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildPlainTextTranscript, buildSrt } from "@/lib/transcription/format";
import { buildDocx } from "@/lib/transcription/docx";
import type { Transcript } from "@/lib/types";

const FORMATS = ["txt", "srt", "docx"] as const;
type Format = (typeof FORMATS)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTranscriptionRequestAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;
  const format = (req.nextUrl.searchParams.get("format") || "txt") as Format;
  if (!FORMATS.includes(format)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }

  const { data: job, error } = await getSupabaseAdmin()
    .from("transcription_jobs")
    .select("original_filename, status, transcript, speaker_names")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (job.status !== "done" || !job.transcript) {
    return NextResponse.json({ error: "NOT_READY" }, { status: 409 });
  }

  const transcript = job.transcript as Transcript;
  const speakerNames = (job.speaker_names ?? {}) as Record<string, string>;
  const baseName = job.original_filename.replace(/\.[^.]+$/, "");

  if (format === "txt") {
    const text = buildPlainTextTranscript(transcript, speakerNames, job.original_filename);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.txt"`,
      },
    });
  }

  if (format === "srt") {
    const srt = buildSrt(transcript, speakerNames);
    return new NextResponse(srt, {
      headers: {
        "Content-Type": "application/x-subrip; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.srt"`,
      },
    });
  }

  const docxBuffer = await buildDocx(transcript, speakerNames, job.original_filename);
  return new NextResponse(new Uint8Array(docxBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.docx"`,
    },
  });
}
