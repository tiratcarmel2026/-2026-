"""Fetch the uploaded recording from Supabase Storage to a local temp file."""
from __future__ import annotations

import uuid
from pathlib import Path

from .. import config
from . import supabase_rest


def download_to_tempfile(bucket: str, path: str) -> Path:
    data = supabase_rest.download_recording(bucket, path)
    suffix = Path(path).suffix or ".audio"
    local_path = config.TMP_DIR / f"{uuid.uuid4()}{suffix}"
    local_path.write_bytes(data)
    return local_path
