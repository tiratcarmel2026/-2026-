"""Combine Whisper's transcript segments with pyannote's speaker turns."""
from __future__ import annotations


def assign_speakers(transcript_segments: list[dict], diarization_turns: list[dict]) -> list[dict]:
    """For each transcript segment, pick the diarization turn it overlaps
    with the most. Falls back to a single implicit speaker if diarization
    found none (e.g. a solo recording, or diarization disabled).
    """
    if not diarization_turns:
        return [{**seg, "speaker": "SPEAKER_00"} for seg in transcript_segments]

    labeled = []
    for seg in transcript_segments:
        best_speaker = None
        best_overlap = 0.0
        for turn in diarization_turns:
            overlap = min(seg["end"], turn["end"]) - max(seg["start"], turn["start"])
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = turn["speaker"]
        if best_speaker is None:
            # No temporal overlap (gap in diarization) - use the nearest turn.
            nearest = min(
                diarization_turns,
                key=lambda t: min(abs(t["start"] - seg["end"]), abs(t["end"] - seg["start"])),
            )
            best_speaker = nearest["speaker"]
        labeled.append({**seg, "speaker": best_speaker})
    return labeled


def merge_consecutive(labeled_segments: list[dict], max_gap_seconds: float = 1.0) -> list[dict]:
    """Merge consecutive segments from the same speaker into one utterance,
    so the transcript reads as natural paragraphs instead of one line per
    Whisper micro-segment.
    """
    merged: list[dict] = []
    for seg in labeled_segments:
        prev = merged[-1] if merged else None
        if prev and prev["speaker"] == seg["speaker"] and seg["start"] - prev["end"] <= max_gap_seconds:
            prev["end"] = seg["end"]
            prev["text"] = f"{prev['text']} {seg['text']}".strip()
        else:
            merged.append(dict(seg))
    return merged
