"""Central configuration, read from environment variables (.env)."""
from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "storage" / "tmp"
TMP_DIR.mkdir(parents=True, exist_ok=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Hugging Face token with access to the gated pyannote speaker-diarization
# model (accept the model's terms at https://huggingface.co/pyannote/speaker-diarization-3.1
# and https://huggingface.co/pyannote/segmentation-3.0 first).
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# faster-whisper (CTranslate2) model id or local path. Defaults to an
# ivrit-ai model fine-tuned for Hebrew, which transcribes Hebrew speech
# noticeably better than stock Whisper. Check https://huggingface.co/ivrit-ai
# for the current recommended release - swap this if a newer one exists.
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "ivrit-ai/whisper-large-v3-turbo-ct2")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cuda")  # "cuda" or "cpu"
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "float16")  # e.g. int8 on CPU

DIARIZATION_MODEL = os.environ.get("DIARIZATION_MODEL", "pyannote/speaker-diarization-3.1")
DIARIZATION_DEVICE = os.environ.get("DIARIZATION_DEVICE", WHISPER_DEVICE)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "10"))

# Max characters of the transcript sent to Claude for speaker-name guessing,
# to keep the request bounded even for very long recordings.
MAX_TRANSCRIPT_CHARS_FOR_NAMING = int(
    os.environ.get("MAX_TRANSCRIPT_CHARS_FOR_NAMING", "300000")
)


def require_supabase_config() -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables"
        )
