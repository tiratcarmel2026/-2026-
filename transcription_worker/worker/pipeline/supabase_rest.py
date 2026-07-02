"""Thin REST wrapper around Supabase (PostgREST + Storage), using the
service role key. No supabase-py dependency needed for the handful of calls
the worker makes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import requests

from .. import config

_TABLE = "transcription_jobs"


def _headers(extra: dict | None = None) -> dict:
    headers = {
        "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
    }
    if extra:
        headers.update(extra)
    return headers


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def claim_next_pending_job() -> dict[str, Any] | None:
    """Atomically-ish claim the oldest 'pending' job: read the candidate,
    then update it conditioned on it still being 'pending'. If another
    worker won the race, the conditional update returns no rows and we just
    try again on the next poll - fine for the expected single-worker setup.
    """
    resp = requests.get(
        f"{config.SUPABASE_URL}/rest/v1/{_TABLE}",
        headers=_headers(),
        params={
            "select": "id,original_filename,storage_bucket,storage_path",
            "status": "eq.pending",
            "order": "created_at.asc",
            "limit": "1",
        },
        timeout=30,
    )
    resp.raise_for_status()
    candidates = resp.json()
    if not candidates:
        return None
    job = candidates[0]

    update_resp = requests.patch(
        f"{config.SUPABASE_URL}/rest/v1/{_TABLE}",
        headers=_headers({"Content-Type": "application/json", "Prefer": "return=representation"}),
        params={"id": f"eq.{job['id']}", "status": "eq.pending"},
        json={"status": "processing", "claimed_at": _now_iso(), "updated_at": _now_iso()},
        timeout=30,
    )
    update_resp.raise_for_status()
    claimed = update_resp.json()
    if not claimed:
        return None
    return job


def update_job(job_id: str, **fields: Any) -> None:
    fields["updated_at"] = _now_iso()
    resp = requests.patch(
        f"{config.SUPABASE_URL}/rest/v1/{_TABLE}",
        headers=_headers({"Content-Type": "application/json", "Prefer": "return=minimal"}),
        params={"id": f"eq.{job_id}"},
        json=fields,
        timeout=30,
    )
    resp.raise_for_status()


def update_progress(job_id: str, stage: str, percent: int) -> None:
    update_job(job_id, progress_stage=stage, progress_percent=percent)


def mark_done(
    job_id: str,
    transcript: dict[str, Any],
    speaker_names: dict[str, str],
    duration_seconds: float,
) -> None:
    update_job(
        job_id,
        status="done",
        progress_stage="finalizing",
        progress_percent=100,
        transcript=transcript,
        speaker_names=speaker_names,
        duration_seconds=duration_seconds,
        error_message=None,
    )


def mark_failed(job_id: str, error_message: str) -> None:
    update_job(job_id, status="failed", error_message=error_message[:2000])


def download_recording(bucket: str, path: str) -> bytes:
    resp = requests.get(
        f"{config.SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        headers=_headers(),
        timeout=(30, 600),
    )
    resp.raise_for_status()
    return resp.content
