"""Document structure analysis: headings, paragraphs, lists, tables and a
best-effort logical reading order, derived from font size/weight/position
(PyMuPDF `get_text("dict")` and `find_tables()`).

This is a heuristic layout analyzer, not a full document-understanding
model - it works well on typical single/two-column reports, letters and
forms, and is expected to need manual review on very irregular layouts
(magazines, multi-panel infographics, etc.). That caveat is surfaced in the
accessibility report.
"""
from __future__ import annotations

import re
import statistics
from collections import Counter

import fitz  # PyMuPDF

from .models import BlockKind, DocumentModel, TableCell, TableInfo, TextBlock

_BOLD_FLAG = 1 << 4

_LIST_MARKER_RE = re.compile(
    r"^\s*("
    r"[•◦▪‣●○*\-–]"  # bullet glyphs
    r"|\d{1,3}[\.\)]"  # 1. / 1)
    r"|[א-ת][\.\)]"  # Hebrew letter list marker
    r"|[ivxlcdm]{1,4}[\.\)]"  # roman numerals
    r")\s+"
)

MAX_HEADING_LEVELS = 6


def _line_text_and_style(line: dict) -> tuple[str, float, bool]:
    spans = line.get("spans", [])
    text = "".join(s.get("text", "") for s in spans).strip()
    if not spans:
        return text, 0.0, False
    size = max((s.get("size", 0.0) for s in spans), default=0.0)
    bold = any((s.get("flags", 0) & _BOLD_FLAG) for s in spans)
    return text, size, bold


def _body_font_size(doc: fitz.Document) -> float:
    sizes: Counter[float] = Counter()
    for page in doc:
        d = page.get_text("dict")
        for block in d.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                _, size, _ = _line_text_and_style(line)
                if size > 0:
                    sizes[round(size, 1)] += 1
    if not sizes:
        return 11.0
    return sizes.most_common(1)[0][0]


def _bbox_overlaps(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> bool:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    if ix0 >= ix1 or iy0 >= iy1:
        return False
    inter = (ix1 - ix0) * (iy1 - iy0)
    area_a = max(ax1 - ax0, 1e-6) * max(ay1 - ay0, 1e-6)
    return inter / area_a > 0.5


def extract_tables(page: fitz.Page, page_index: int) -> list[TableInfo]:
    tables: list[TableInfo] = []
    try:
        finder = page.find_tables()
    except Exception:  # noqa: BLE001 - table finder is best-effort
        return tables

    for t in finder.tables:
        try:
            rows = t.extract()
        except Exception:  # noqa: BLE001
            continue
        if not rows:
            continue
        cells: list[TableCell] = []
        for r, row in enumerate(rows):
            for c, val in enumerate(row):
                cells.append(
                    TableCell(row=r, col=c, text=(val or "").strip(), is_header=(r == 0))
                )
        tables.append(
            TableInfo(
                page=page_index,
                bbox=tuple(t.bbox),
                n_rows=len(rows),
                n_cols=max((len(r) for r in rows), default=0),
                cells=cells,
            )
        )
    return tables


def extract_page_blocks(
    page: fitz.Page, page_index: int, table_bboxes: list[tuple[float, float, float, float]]
) -> list[TextBlock]:
    blocks: list[TextBlock] = []
    d = page.get_text("dict")
    order = 0
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        bbox = tuple(block.get("bbox", (0, 0, 0, 0)))
        if any(_bbox_overlaps(bbox, tb) for tb in table_bboxes):
            continue  # this text belongs to a detected table, handled separately

        lines_text = []
        sizes = []
        bolds = []
        for line in block.get("lines", []):
            text, size, bold = _line_text_and_style(line)
            if not text:
                continue
            lines_text.append(text)
            sizes.append(size)
            bolds.append(bold)

        if not lines_text:
            continue

        full_text = "\n".join(lines_text)
        rep_size = statistics.median(sizes) if sizes else 0.0
        is_bold = sum(bolds) > len(bolds) / 2 if bolds else False

        blocks.append(
            TextBlock(
                page=page_index,
                bbox=bbox,
                text=full_text,
                font_size=rep_size,
                is_bold=is_bold,
                physical_order=order,
            )
        )
        order += 1
    return blocks


def classify_blocks(blocks: list[TextBlock], body_size: float) -> None:
    """Assign heading levels / list-item kind in place."""
    heading_sizes = sorted(
        {
            round(b.font_size, 1)
            for b in blocks
            if b.font_size > body_size * 1.12 and len(b.text) < 200
        },
        reverse=True,
    )[:MAX_HEADING_LEVELS]
    level_by_size = {size: i + 1 for i, size in enumerate(heading_sizes)}

    for b in blocks:
        first_line = b.text.splitlines()[0] if b.text else ""
        size_r = round(b.font_size, 1)
        if size_r in level_by_size and len(b.text) < 200:
            b.kind = BlockKind.HEADING
            b.heading_level = level_by_size[size_r]
        elif _LIST_MARKER_RE.match(first_line):
            b.kind = BlockKind.LIST_ITEM
        else:
            b.kind = BlockKind.PARAGRAPH


def _column_index(bbox: tuple[float, float, float, float], page_width: float) -> int:
    center_x = (bbox[0] + bbox[2]) / 2
    if page_width <= 0:
        return 0
    ratio = center_x / page_width
    if ratio < 0.48:
        return 0
    if ratio > 0.52:
        return 1
    return 0


def compute_reading_order(doc_model: DocumentModel, page_widths: dict[int, float]) -> None:
    """Assign `reading_order` (per page) across blocks/tables/figures using a
    simple column-aware top-to-bottom, left-to-right heuristic.
    """
    items_by_page: dict[int, list] = {}
    for b in doc_model.blocks:
        items_by_page.setdefault(b.page, []).append(b)
    for t in doc_model.tables:
        items_by_page.setdefault(t.page, []).append(t)
    for f in doc_model.figures:
        items_by_page.setdefault(f.page, []).append(f)

    for page_index, items in items_by_page.items():
        width = page_widths.get(page_index, 0.0)

        def sort_key(item):
            col = _column_index(item.bbox, width)
            return (col, item.bbox[1], item.bbox[0])

        items.sort(key=sort_key)
        for i, item in enumerate(items):
            item.reading_order = i


def analyze_structure(doc: fitz.Document, doc_model: DocumentModel) -> dict[int, float]:
    """Extracts blocks/tables and classifies them. Does *not* compute reading
    order yet (figures aren't known at this point) - call
    `compute_reading_order` afterwards once `doc_model.figures` is populated.
    Returns the per-page widths, needed by `compute_reading_order`.
    """
    body_size = _body_font_size(doc)
    all_blocks: list[TextBlock] = []
    page_widths: dict[int, float] = {}

    for page_index in range(doc.page_count):
        page = doc[page_index]
        page_widths[page_index] = page.rect.width
        tables = extract_tables(page, page_index)
        doc_model.tables.extend(tables)
        table_bboxes = [t.bbox for t in tables]
        blocks = extract_page_blocks(page, page_index, table_bboxes)
        all_blocks.extend(blocks)

    classify_blocks(all_blocks, body_size)
    doc_model.blocks = all_blocks
    return page_widths
