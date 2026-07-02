"""Locate a Unicode-capable TTF font on the host system.

The invisible OCR text layer and any Hebrew UI text embedded in the PDF need a
font whose cmap actually covers the Hebrew block - the PDF base-14 fonts
(Helvetica etc.) do not, and silently produce garbage on text extraction.
"""
from __future__ import annotations

from pathlib import Path

_CANDIDATES = [
    # Debian/Ubuntu
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansHebrew-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansHebrew-Regular.ttf",
    # Fedora/RHEL
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    # macOS
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    # Windows
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\ArialUni.ttf",
]

_cached: str | None | bool = False  # False = not looked up yet


def find_unicode_font() -> str | None:
    global _cached
    if _cached is not False:
        return _cached  # type: ignore[return-value]
    for candidate in _CANDIDATES:
        if Path(candidate).is_file():
            _cached = candidate
            return candidate
    _cached = None
    return None
