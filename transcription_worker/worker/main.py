"""Polling worker: picks up 'pending' transcription jobs from Supabase,
runs Hebrew ASR + speaker diarization, and writes the result back.

Run from the transcription_worker/ directory with:
    python -m worker.main
"""
from __future__ import annotations

import logging
import time
import traceback

from . import config
from .pipeline import diarize, download, merge, speaker_names, supabase_rest, transcribe

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("worker")


def process_job(job: dict) -> None:
    job_id = job["id"]
    logger.info("Processing job %s (%s)", job_id, job["original_filename"])

    audio_path = download.download_to_tempfile(job["storage_bucket"], job["storage_path"])
    try:
        supabase_rest.update_progress(job_id, "transcribing", 5)

        def on_transcribe_progress(pos: float, total: float) -> None:
            pct = 5 + int(50 * (pos / total)) if total else 5
            supabase_rest.update_progress(job_id, "transcribing", min(pct, 55))

        segments, duration = transcribe.transcribe(audio_path, on_progress=on_transcribe_progress)

        supabase_rest.update_progress(job_id, "diarizing", 60)
        turns = diarize.diarize(audio_path)

        supabase_rest.update_progress(job_id, "finalizing", 85)
        labeled = merge.assign_speakers(segments, turns)
        merged = merge.merge_consecutive(labeled)
        speakers = sorted({seg["speaker"] for seg in merged})

        supabase_rest.update_progress(job_id, "naming_speakers", 92)
        names = speaker_names.guess_speaker_names(merged, speakers)

        supabase_rest.mark_done(
            job_id,
            transcript={"segments": merged, "speakers": speakers},
            speaker_names=names,
            duration_seconds=duration,
        )
        logger.info("Job %s done (%d segments, %d speakers)", job_id, len(merged), len(speakers))
    finally:
        audio_path.unlink(missing_ok=True)


def main() -> None:
    config.require_supabase_config()
    logger.info("Transcription worker started, polling every %ss", config.POLL_INTERVAL_SECONDS)
    while True:
        try:
            job = supabase_rest.claim_next_pending_job()
        except Exception:
            logger.error("Failed to poll for jobs:\n%s", traceback.format_exc())
            time.sleep(config.POLL_INTERVAL_SECONDS)
            continue

        if job is None:
            time.sleep(config.POLL_INTERVAL_SECONDS)
            continue

        try:
            process_job(job)
        except Exception as exc:
            logger.error("Job %s failed:\n%s", job["id"], traceback.format_exc())
            try:
                supabase_rest.mark_failed(job["id"], f"{type(exc).__name__}: {exc}")
            except Exception:
                logger.error("Failed to record failure for job %s:\n%s", job["id"], traceback.format_exc())


if __name__ == "__main__":
    main()
