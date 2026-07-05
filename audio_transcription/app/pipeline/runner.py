"""In-memory job tracking + end-to-end pipeline orchestration.

Jobs live in a process-wide dict (single-server local/small-deployment tool,
same tradeoff as pdf_accessibility) - restarting the server loses in-flight
and past job state. For a multi-hour recording, make sure the hosting
service does not spin down or restart in the middle of processing.
"""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path

from .. import config
from . import diarize, merge, speaker_names, transcribe

logger = logging.getLogger(__name__)


@dataclass
class TranscriptionJob:
    original_filename: str
    status: str = "processing"  # processing | done | failed
    stage: str = "transcribing"  # transcribing | diarizing | naming_speakers | finalizing | done
    percent: int = 0
    error: str | None = None
    duration_seconds: float | None = None
    transcript: dict | None = None
    speaker_names: dict[str, str] = field(default_factory=dict)


_JOBS: dict[str, TranscriptionJob] = {}
_LOCK = threading.Lock()


def create_job(job_id: str, original_filename: str) -> None:
    with _LOCK:
        _JOBS[job_id] = TranscriptionJob(original_filename=original_filename)


def get_job(job_id: str) -> TranscriptionJob | None:
    with _LOCK:
        return _JOBS.get(job_id)


def rename_speaker(job_id: str, speaker: str, name: str) -> dict[str, str] | None:
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return None
        job.speaker_names = {**job.speaker_names, speaker: name.strip()}
        return job.speaker_names


def _update(job_id: str, **fields) -> None:
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return
        for key, value in fields.items():
            setattr(job, key, value)


def run_job(job_id: str, audio_path: Path) -> None:
    """Runs synchronously on a background thread/task - the whole point is
    that this can take a very long time for a 3-4 hour recording.
    """
    try:
        _update(job_id, stage="transcribing", percent=5)

        def on_progress(position: float, total: float) -> None:
            percent = 5 + int(50 * (position / total)) if total else 5
            _update(job_id, percent=min(percent, 55))

        segments, duration = transcribe.transcribe(audio_path, on_progress=on_progress)
        _update(job_id, duration_seconds=duration)

        turns: list[dict] = []
        if config.ENABLE_DIARIZATION:
            _update(job_id, stage="diarizing", percent=60)
            turns = diarize.diarize(audio_path)

        _update(job_id, stage="finalizing", percent=85)
        labeled = merge.assign_speakers(segments, turns)
        merged = merge.merge_consecutive(labeled)
        speakers = sorted({seg["speaker"] for seg in merged})

        _update(job_id, stage="naming_speakers", percent=92)
        names = speaker_names.guess_speaker_names(merged, speakers)

        _update(
            job_id,
            status="done",
            stage="done",
            percent=100,
            transcript={"segments": merged, "speakers": speakers},
            speaker_names=names,
        )
        logger.info("Job %s done (%d segments, %d speakers)", job_id, len(merged), len(speakers))
    except Exception as exc:  # noqa: BLE001 - report to the client instead of crashing the worker thread
        logger.exception("Job %s failed", job_id)
        _update(job_id, status="failed", error=f"{type(exc).__name__}: {exc}")
    finally:
        audio_path.unlink(missing_ok=True)
