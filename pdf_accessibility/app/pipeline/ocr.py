"""OCR for scanned PDFs: renders each page to an image, runs pytesseract, and
writes the recognized words back as an invisible (render_mode=3) text layer
at their original positions, so the page keeps its scanned look but becomes
searchable / selectable / readable by screen readers.
"""
from __future__ import annotations

import logging

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

from .. import config
from .fonts import find_unicode_font

logger = logging.getLogger(__name__)

_MIN_CONFIDENCE = 30
_FONT_ALIAS = "ocrunicode"


def _ensure_font(page: fitz.Page) -> str:
    """Insert a Unicode font on the page (if available) and return its fontname
    to use with insert_text. Falls back to the base-14 Helvetica if no
    Unicode TTF could be located on the host - Latin text still works, and
    non-Latin scripts remain invisible/unmapped (see warning surfaced by the
    caller via `find_unicode_font() is None`).
    """
    font_path = find_unicode_font()
    if not font_path:
        return "helv"
    try:
        page.insert_font(fontfile=font_path, fontname=_FONT_ALIAS)
        return _FONT_ALIAS
    except Exception:  # noqa: BLE001
        return "helv"


def ocr_page(
    doc: fitz.Document,
    page_index: int,
    langs: str = config.TESSERACT_LANGS,
    dpi: int = config.OCR_DPI,
) -> int:
    """Run OCR on a single page and insert an invisible text layer.

    Returns the number of words successfully embedded.
    """
    page = doc[page_index]
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)

    try:
        data = pytesseract.image_to_data(
            image, lang=langs, output_type=pytesseract.Output.DICT
        )
    except pytesseract.TesseractError as exc:
        logger.warning("OCR failed on page %s: %s", page_index, exc)
        return 0

    fontname = _ensure_font(page)

    # Group words into lines (tesseract's block/par/line numbering) and embed
    # one text-showing call per line: this keeps the words in their natural
    # reading order within the line (instead of one disconnected run per
    # word) and gives the downstream layout analyzer real line/paragraph
    # geometry to group into blocks.
    lines: dict[tuple[int, int, int], list[int]] = {}
    n = len(data.get("text", []))
    for i in range(n):
        word = data["text"][i].strip()
        if not word:
            continue
        try:
            conf = float(data["conf"][i])
        except (ValueError, TypeError):
            conf = -1
        if conf < _MIN_CONFIDENCE:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append(i)

    words_added = 0
    for indices in lines.values():
        indices.sort(key=lambda i: data["word_num"][i])
        words = [data["text"][i].strip() for i in indices]
        line_text = " ".join(words)

        x0s = [data["left"][i] for i in indices]
        y0s = [data["top"][i] for i in indices]
        x1s = [data["left"][i] + data["width"][i] for i in indices]
        y1s = [data["top"][i] + data["height"][i] for i in indices]
        x, y = min(x0s), min(y0s)
        w, h = max(x1s) - x, max(y1s) - y
        if w <= 0 or h <= 0:
            continue

        x0, y0, w0, h0 = x / zoom, y / zoom, w / zoom, h / zoom
        fontsize = max(h0 * 0.8, 1.0)
        baseline = (x0, y0 + h0 * 0.85)
        try:
            page.insert_text(
                baseline,
                line_text,
                fontsize=fontsize,
                fontname=fontname,
                render_mode=3,  # invisible - keeps the scanned look, adds a text layer
            )
        except Exception:  # noqa: BLE001 - a single bad line shouldn't abort the page
            continue
        words_added += len(words)

    return words_added


def ocr_document(doc: fitz.Document, langs: str = config.TESSERACT_LANGS) -> dict[int, int]:
    """OCR every page in the document. Returns {page_index: words_added}."""
    results: dict[int, int] = {}
    for i in range(doc.page_count):
        results[i] = ocr_page(doc, i, langs=langs)
    return results
