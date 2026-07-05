"""Central configuration, read from environment variables (.env)."""
from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
OUTPUT_DIR = STORAGE_DIR / "outputs"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# A 3-4 hour recording can easily be several hundred MB.
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", "1024"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# ===== Whisper (Hebrew ASR) =====
# CTranslate2/faster-whisper model id. Default is an ivrit-ai model tuned for
# Hebrew - check https://huggingface.co/ivrit-ai for the current recommended
# release. On a CPU-only host (e.g. Render, no GPU), a smaller model such as
# "ivrit-ai/whisper-large-v3-ct2" or plain faster-whisper "medium"/"small" is
# far more realistic than large-v3-turbo for multi-hour recordings.
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "ivrit-ai/whisper-large-v3-turbo-ct2")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")  # "cuda" if you have a GPU host
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

# ===== Diarization (who spoke when) =====
ENABLE_DIARIZATION = os.environ.get("ENABLE_DIARIZATION", "true").lower() != "false"
DIARIZATION_MODEL = os.environ.get("DIARIZATION_MODEL", "pyannote/speaker-diarization-3.1")
DIARIZATION_DEVICE = os.environ.get("DIARIZATION_DEVICE", WHISPER_DEVICE)
# Hugging Face token with access to the gated diarization model - accept the
# terms at https://huggingface.co/pyannote/speaker-diarization-3.1 and
# https://huggingface.co/pyannote/segmentation-3.0 first.
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# ===== Speaker name guessing (optional) =====
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
MAX_TRANSCRIPT_CHARS_FOR_NAMING = int(os.environ.get("MAX_TRANSCRIPT_CHARS_FOR_NAMING", "300000"))

JOB_TTL_HOURS = int(os.environ.get("JOB_TTL_HOURS", "24"))
