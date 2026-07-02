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

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

# Safety limits
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_PAGES = int(os.environ.get("MAX_PAGES", "300"))

# OCR
TESSERACT_LANGS = os.environ.get("TESSERACT_LANGS", "heb+eng")
OCR_DPI = int(os.environ.get("OCR_DPI", "300"))
SCANNED_TEXT_CHAR_THRESHOLD = int(os.environ.get("SCANNED_TEXT_CHAR_THRESHOLD", "20"))

# Alt-text
MAX_IMAGES_FOR_ALT_TEXT = int(os.environ.get("MAX_IMAGES_FOR_ALT_TEXT", "60"))
MIN_IMAGE_SIZE_PX = int(os.environ.get("MIN_IMAGE_SIZE_PX", "32"))

JOB_TTL_HOURS = int(os.environ.get("JOB_TTL_HOURS", "24"))
