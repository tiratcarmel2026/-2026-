"""Plain-text and SRT export, built from the transcript + current speaker
names at download time (so renaming a speaker never requires re-running the
pipeline).
"""
from __future__ import annotations


def speaker_display_name(speaker: str, speaker_names: dict[str, str], speakers: list[str]) -> str:
    custom = (speaker_names.get(speaker) or "").strip()
    if custom:
        return custom
    index = speakers.index(speaker) if speaker in speakers else -1
    return f"דובר {index + 1}" if index >= 0 else speaker


def format_timestamp_short(total_seconds: float) -> str:
    """"01:02:03" - used inline in the plain-text export."""
    clamped = max(0, int(total_seconds))
    hours, remainder = divmod(clamped, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def format_srt_timestamp(total_seconds: float) -> str:
    """"01:02:03,456" - SRT requires a comma before the milliseconds."""
    clamped = max(0.0, total_seconds)
    hours, remainder = divmod(clamped, 3600)
    minutes, seconds = divmod(remainder, 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d},{millis:03d}"


def build_plain_text(transcript: dict, speaker_names: dict[str, str], original_filename: str) -> str:
    lines = [f"תמלול: {original_filename}", ""]
    for seg in transcript["segments"]:
        name = speaker_display_name(seg["speaker"], speaker_names, transcript["speakers"])
        lines.append(f"[{format_timestamp_short(seg['start'])}] {name}: {seg['text']}")
    return "\n".join(lines)


def build_srt(transcript: dict, speaker_names: dict[str, str]) -> str:
    blocks = []
    for i, seg in enumerate(transcript["segments"], start=1):
        name = speaker_display_name(seg["speaker"], speaker_names, transcript["speakers"])
        blocks.append(
            f"{i}\n{format_srt_timestamp(seg['start'])} --> {format_srt_timestamp(seg['end'])}\n"
            f"{name}: {seg['text']}\n"
        )
    return "\n".join(blocks)
