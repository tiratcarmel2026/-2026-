"""Internal data structures shared across the pipeline stages."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class BlockKind(str, Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST_ITEM = "list_item"


BBox = tuple[float, float, float, float]  # x0, y0, x1, y1


@dataclass
class TextBlock:
    page: int
    bbox: BBox
    text: str
    font_size: float
    is_bold: bool
    physical_order: int  # order of appearance in the page's content stream
    kind: BlockKind = BlockKind.PARAGRAPH
    heading_level: int = 0
    reading_order: int = 0  # assigned after column-aware sorting
    mcid: int | None = None  # assigned during tagging


@dataclass
class TableCell:
    row: int
    col: int
    text: str
    is_header: bool


@dataclass
class TableInfo:
    page: int
    bbox: BBox
    n_rows: int
    n_cols: int
    cells: list[TableCell]
    reading_order: int = 0


@dataclass
class FigureInfo:
    page: int
    xref: int
    bbox: BBox
    png_bytes: bytes
    width: int
    height: int
    alt_text: str | None = None
    alt_source: str = "none"  # "claude" | "fallback" | "none"
    reading_order: int = 0
    mcid: int | None = None


@dataclass
class PageResult:
    page: int
    ocr_applied: bool = False
    ocr_words_added: int = 0
    tagging_error: str | None = None


@dataclass
class DocumentModel:
    n_pages: int
    is_scanned: bool = False
    language: str = "und"
    title: str = ""
    blocks: list[TextBlock] = field(default_factory=list)
    tables: list[TableInfo] = field(default_factory=list)
    figures: list[FigureInfo] = field(default_factory=list)
    pages: list[PageResult] = field(default_factory=list)


@dataclass
class AccessibilityReport:
    source_filename: str
    n_pages: int
    is_scanned: bool
    language: str
    automated_actions: list[str] = field(default_factory=list)
    manual_review_items: list[str] = field(default_factory=list)
    stats: dict = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
