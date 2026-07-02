"""Validate an uploaded PDF and detect whether it is scanned (image-only)."""
from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF
import pikepdf

from .. import config
from .errors import (
    CorruptPDFError,
    EmptyPDFError,
    EncryptedPDFError,
    FileTooLargeError,
    NotAPDFError,
    TooManyPagesError,
)


def _strip_path(message: str, path: Path) -> str:
    """Error messages from pikepdf/fitz embed the server-side temp file path -
    strip it so it isn't leaked to the end user."""
    return message.replace(str(path), path.name)


def validate_upload(path: Path) -> None:
    """Cheap checks that don't require parsing the whole file."""
    size = path.stat().st_size
    if size > config.MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError(size / (1024 * 1024), config.MAX_FILE_SIZE_MB)
    if size == 0:
        raise CorruptPDFError("הקובץ ריק")

    with open(path, "rb") as f:
        header = f.read(5)
    if header != b"%PDF-":
        raise NotAPDFError()


def open_document(path: Path) -> fitz.Document:
    """Open the PDF with PyMuPDF, raising clear errors for common failure modes."""
    validate_upload(path)

    # pikepdf gives a cleaner encrypted/corrupt distinction than fitz alone.
    try:
        with pikepdf.open(str(path)):
            pass
    except pikepdf.PasswordError:
        raise EncryptedPDFError()
    except pikepdf.PdfError as exc:
        raise CorruptPDFError(_strip_path(str(exc), path))

    try:
        doc = fitz.open(str(path))
    except Exception as exc:  # noqa: BLE001 - fitz raises plain Exception/RuntimeError
        raise CorruptPDFError(_strip_path(str(exc), path))

    if doc.needs_pass:
        doc.close()
        raise EncryptedPDFError()

    if doc.page_count == 0:
        doc.close()
        raise EmptyPDFError()

    if doc.page_count > config.MAX_PAGES:
        n = doc.page_count
        doc.close()
        raise TooManyPagesError(n, config.MAX_PAGES)

    return doc


def page_text_char_count(page: fitz.Page) -> int:
    return len(page.get_text("text").strip())


def page_image_coverage_ratio(page: fitz.Page) -> float:
    """Fraction of the page area covered by raster images (rough heuristic)."""
    page_area = page.rect.width * page.rect.height
    if page_area <= 0:
        return 0.0
    covered = 0.0
    for img in page.get_image_info():
        bbox = img.get("bbox")
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        covered += max(0.0, x1 - x0) * max(0.0, y1 - y0)
    return min(covered / page_area, 1.0)


def detect_scanned(doc: fitz.Document, sample_pages: int = 5) -> bool:
    """Heuristic: a document is "scanned" when its pages carry almost no
    extractable text but are covered by large raster images.
    """
    n = doc.page_count
    indices = list(range(n)) if n <= sample_pages else [
        int(i * (n - 1) / (sample_pages - 1)) for i in range(sample_pages)
    ]
    text_chars = 0
    image_heavy_pages = 0
    for i in indices:
        page = doc[i]
        text_chars += page_text_char_count(page)
        if page_image_coverage_ratio(page) > 0.5:
            image_heavy_pages += 1

    avg_chars = text_chars / max(len(indices), 1)
    return avg_chars < config.SCANNED_TEXT_CHAR_THRESHOLD and image_heavy_pages >= max(
        1, len(indices) // 2
    )
