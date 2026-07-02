"""Extract embedded raster images from the PDF as candidate <Figure> elements."""
from __future__ import annotations

import io
import logging

import fitz  # PyMuPDF
from PIL import Image

from .. import config
from .models import FigureInfo

logger = logging.getLogger(__name__)


def _pixmap_to_png_bytes(doc: fitz.Document, xref: int) -> tuple[bytes, int, int] | None:
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha >= 4:  # CMYK etc. -> convert to RGB first
            pix = fitz.Pixmap(fitz.csRGB, pix)
        png_bytes = pix.tobytes("png")
        return png_bytes, pix.width, pix.height
    except Exception:  # noqa: BLE001
        try:
            base = doc.extract_image(xref)
            img = Image.open(io.BytesIO(base["image"]))
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="PNG")
            return buf.getvalue(), img.width, img.height
        except Exception:  # noqa: BLE001
            logger.warning("Could not decode image xref=%s", xref)
            return None


def extract_images(doc: fitz.Document, is_scanned: bool) -> list[FigureInfo]:
    figures: list[FigureInfo] = []
    seen_xrefs_per_page: set[tuple[int, int]] = set()

    for page_index in range(doc.page_count):
        page = doc[page_index]
        page_area = page.rect.width * page.rect.height

        for img in page.get_images(full=True):
            xref = img[0]
            key = (page_index, xref)
            if key in seen_xrefs_per_page:
                continue
            seen_xrefs_per_page.add(key)

            rects = page.get_image_rects(xref)
            bbox = tuple(rects[0]) if rects else (0.0, 0.0, 0.0, 0.0)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]

            if w < 1 or h < 1:
                continue
            if max(w, h) < (config.MIN_IMAGE_SIZE_PX * 72 / 96):
                continue  # likely a decorative icon/bullet glyph

            if is_scanned and page_area > 0 and (w * h) / page_area > 0.9:
                continue  # this *is* the scanned page, not a figure inside it

            decoded = _pixmap_to_png_bytes(doc, xref)
            if decoded is None:
                continue
            png_bytes, px_w, px_h = decoded

            figures.append(
                FigureInfo(
                    page=page_index,
                    xref=xref,
                    bbox=bbox,
                    png_bytes=png_bytes,
                    width=px_w,
                    height=px_h,
                )
            )

    return figures
