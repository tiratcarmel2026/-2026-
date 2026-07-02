"""End-to-end orchestration of the accessibility pipeline."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF
import pikepdf

from . import alt_text, detect, images, metadata, ocr, report, structure, tagging
from .fonts import find_unicode_font
from .lang import PDF_LANG_TAG, detect_document_language
from .models import AccessibilityReport, BlockKind, DocumentModel

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    output_pdf_path: Path
    report_html_path: Path
    report_pdf_path: Path
    report: AccessibilityReport


def process_pdf(input_path: Path, original_filename: str, job_dir: Path) -> PipelineResult:
    job_dir.mkdir(parents=True, exist_ok=True)
    intermediate_path = job_dir / "intermediate.pdf"
    output_pdf_path = job_dir / "accessible.pdf"
    report_html_path = job_dir / "accessibility_report.html"
    report_pdf_path = job_dir / "accessibility_report.pdf"

    warnings: list[str] = []
    if find_unicode_font() is None:
        warnings.append(
            "לא אותר גופן Unicode (למשל DejaVu Sans) על המערכת. טקסט לועזי/עברי "
            "שנוסף על-ידי OCR עלול לא להיות ניתן לחילוץ נכון. מומלץ להתקין את "
            "החבילה fonts-dejavu-core."
        )

    doc = detect.open_document(input_path)
    try:
        is_scanned = detect.detect_scanned(doc)
        language = detect_document_language(doc)
        title = (doc.metadata or {}).get("title") or Path(original_filename).stem

        ocr_words_by_page: dict[int, int] = {}
        if is_scanned:
            ocr_words_by_page = ocr.ocr_document(doc)
        doc.save(str(intermediate_path))
    finally:
        doc.close()

    # Re-open the saved intermediate file so PyMuPDF's xrefs/bboxes and
    # pikepdf's object numbers refer to the exact same on-disk structure.
    doc2 = fitz.open(str(intermediate_path))
    try:
        doc_model = DocumentModel(
            n_pages=doc2.page_count, is_scanned=is_scanned, language=language, title=title
        )
        page_widths = structure.analyze_structure(doc2, doc_model)
        doc_model.figures = images.extract_images(doc2, is_scanned)
        structure.compute_reading_order(doc_model, page_widths)
    finally:
        doc2.close()

    alt_text.generate_alt_text_for_all(doc_model.figures, language)

    with pikepdf.open(str(intermediate_path)) as pdf:
        tagging_warnings = tagging.build_tagged_structure(pdf, doc_model)
        warnings.extend(tagging_warnings)
        metadata.apply_metadata(pdf, title, PDF_LANG_TAG.get(language, "en"))
        has_acroform = "/AcroForm" in pdf.Root
        pdf.save(str(output_pdf_path))

    acc_report = _build_report(
        original_filename, doc_model, ocr_words_by_page, warnings, has_acroform
    )

    report_html_path.write_text(report.render_html_report(acc_report), encoding="utf-8")
    report.render_pdf_report(acc_report, report_pdf_path)

    return PipelineResult(
        output_pdf_path=output_pdf_path,
        report_html_path=report_html_path,
        report_pdf_path=report_pdf_path,
        report=acc_report,
    )


def _build_report(
    original_filename: str,
    doc_model: DocumentModel,
    ocr_words_by_page: dict[int, int],
    warnings: list[str],
    has_acroform: bool,
) -> AccessibilityReport:
    headings = [b for b in doc_model.blocks if b.kind == BlockKind.HEADING]
    paragraphs = [b for b in doc_model.blocks if b.kind == BlockKind.PARAGRAPH]
    list_items = [b for b in doc_model.blocks if b.kind == BlockKind.LIST_ITEM]
    n_tables = len(doc_model.tables)
    n_cells = sum(len(t.cells) for t in doc_model.tables)
    n_figures = len(doc_model.figures)
    n_claude_alt = sum(1 for f in doc_model.figures if f.alt_source == "claude")
    n_fallback_alt = sum(1 for f in doc_model.figures if f.alt_source in ("fallback", "none"))
    total_ocr_words = sum(ocr_words_by_page.values())

    automated: list[str] = []
    if doc_model.is_scanned:
        automated.append(
            f"זוהה PDF סרוק; הופעל OCR על {len(ocr_words_by_page)} עמודים ונוספה "
            f"שכבת טקסט חבויה (כ-{total_ocr_words} מילים)."
        )
    if headings:
        automated.append(f"זוהו {len(headings)} כותרות ותויגו כ-H1 עד H6 לפי גודל/משקל פונט.")
    if paragraphs:
        automated.append(f"זוהו {len(paragraphs)} פסקאות ותויגו כ-P.")
    if list_items:
        automated.append(f"זוהו {len(list_items)} פריטי רשימה ותויגו כמבנה L / LI / LBody.")
    if n_tables:
        automated.append(
            f"זוהו {n_tables} טבלאות ({n_cells} תאים) ותויגו כ-Table / TR / TH / TD."
        )
    if n_figures:
        automated.append(
            f"נוספו תיאורי alt-text ל-{n_figures} תמונות "
            f"({n_claude_alt} על ידי Claude, {n_fallback_alt} עם טקסט גנרי בלבד)."
        )
    automated.append(
        "הוגדרו metadata: כותרת מסמך, שפת מסמך (Lang), StructTreeRoot, MarkInfo "
        "וסדר קריאה לוגי (reading order)."
    )

    manual: list[str] = []
    if n_tables:
        manual.append(
            "טבלאות: מבנה Table/TR/TH/TD נוצר ברמה הלוגית בלבד, ללא קישור מדויק "
            "(MCID) לתוכן העמוד - יש לוודא ידנית טבלאות מורכבות (תאים ממוזגים, "
            "כותרות מרובות, טבלאות מקוננות)."
        )
    if n_fallback_alt:
        manual.append(
            f"{n_fallback_alt} תמונות קיבלו alt-text גנרי בלבד (ללא זיהוי אוטומטי "
            "מוצלח או ללא מפתח API) - יש לכתוב עבורן תיאור ידני."
        )
    manual.append(
        "קישורים ללא טקסט תיאורי (כגון \"לחץ כאן\", כתובות URL גולמיות) לא זוהו "
        "ולא תוקנו אוטומטית - יש לבדוק ולתקן ידנית."
    )
    manual.append(
        "ניגודיות צבעים בין טקסט לרקע לא נבדקה אוטומטית - חשוב לבדוק בעיקר "
        "בעמודים סרוקים או במסמכים מעוצבים."
    )
    if has_acroform:
        manual.append(
            "המסמך מכיל שדות טופס (AcroForm) - תוויות שדות, סדר טאבים ונגישות "
            "הטופס לא טופלו אוטומטית ודורשים בדיקה ידנית."
        )
    manual.append(
        "סדר הקריאה הלוגי חושב היוריסטית (מיקום/טורים בעמוד) - במסמכים עם "
        "פריסה מורכבת יש לוודא את סדר הקריאה בעזרת Acrobat או PAC."
    )
    if doc_model.is_scanned:
        manual.append(
            "עבור עמודים סרוקים: איכות ה-OCR תלויה בבירור הסריקה; טקסט "
            "שלא זוהה נכון (שגיאות OCR) לא יופיע כראוי לקוראי מסך."
        )

    stats = {
        "עמודים": doc_model.n_pages,
        "כותרות": len(headings),
        "פסקאות": len(paragraphs),
        "פריטי רשימה": len(list_items),
        "טבלאות": n_tables,
        "תמונות": n_figures,
        "מילות OCR שנוספו": total_ocr_words,
    }

    return AccessibilityReport(
        source_filename=original_filename,
        n_pages=doc_model.n_pages,
        is_scanned=doc_model.is_scanned,
        language=doc_model.language,
        automated_actions=automated,
        manual_review_items=manual,
        stats=stats,
        warnings=warnings,
    )
