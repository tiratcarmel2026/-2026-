"""Very small heuristic language detector: Hebrew vs. English, based on the
character distribution of the extracted text. Good enough to pick an OCR
language pack and to prompt Claude in the right language - not a general
language-ID model.
"""
from __future__ import annotations

import re

import fitz

_HEBREW_RE = re.compile(r"[֐-׿]")
_LATIN_RE = re.compile(r"[A-Za-z]")


def detect_document_language(doc: fitz.Document, sample_pages: int = 8) -> str:
    n = doc.page_count
    indices = range(n) if n <= sample_pages else (
        int(i * (n - 1) / (sample_pages - 1)) for i in range(sample_pages)
    )
    sample = "".join(doc[i].get_text("text") for i in indices)
    hebrew = len(_HEBREW_RE.findall(sample))
    latin = len(_LATIN_RE.findall(sample))
    if hebrew == 0 and latin == 0:
        return "und"
    return "he" if hebrew >= latin else "en"


PDF_LANG_TAG = {"he": "he", "en": "en", "und": "en"}
