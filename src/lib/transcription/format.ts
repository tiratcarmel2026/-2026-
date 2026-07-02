import type { Transcript, TranscriptSegment } from "@/lib/types";

export function speakerDisplayName(
  speaker: string,
  speakerNames: Record<string, string>,
  speakers: string[]
): string {
  const custom = speakerNames[speaker]?.trim();
  if (custom) return custom;
  const index = speakers.indexOf(speaker);
  return `דובר ${index >= 0 ? index + 1 : speaker}`;
}

function formatClockHms(totalSeconds: number, msSeparator: string): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const millis = Math.floor((clamped - Math.floor(clamped)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${msSeparator}${pad(millis, 3)}`;
}

/** "01:02:03" - used inline in the plain-text export. */
export function formatTimestampShort(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** "01:02:03,456" - SRT requires a comma before the milliseconds. */
export function formatSrtTimestamp(totalSeconds: number): string {
  return formatClockHms(totalSeconds, ",");
}

export function buildPlainTextTranscript(
  transcript: Transcript,
  speakerNames: Record<string, string>,
  originalFilename: string
): string {
  const lines = [`תמלול: ${originalFilename}`, ""];
  for (const segment of transcript.segments) {
    const name = speakerDisplayName(segment.speaker, speakerNames, transcript.speakers);
    lines.push(`[${formatTimestampShort(segment.start)}] ${name}: ${segment.text}`);
  }
  return lines.join("\n");
}

export function buildSrt(transcript: Transcript, speakerNames: Record<string, string>): string {
  const blocks = transcript.segments.map((segment: TranscriptSegment, i: number) => {
    const name = speakerDisplayName(segment.speaker, speakerNames, transcript.speakers);
    return [
      String(i + 1),
      `${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(segment.end)}`,
      `${name}: ${segment.text}`,
      "",
    ].join("\n");
  });
  return blocks.join("\n");
}
