"""Render the accessibility report as HTML (primary) and PDF (companion)."""
from __future__ import annotations

import html
from pathlib import Path

from .fonts import find_unicode_font
from .models import AccessibilityReport

PAC_DISCLAIMER_HE = (
    "הפלט של מערכת זו הוא ניסיון אוטומטי להנגשת ה-PDF ואינו מובטח לעמוד "
    "בתקן PDF/UA באופן מלא. לפני שימוש רשמי, משפטי או פרסום ציבורי של הקובץ, "
    "יש לאמת אותו בכלי ייעודי כגון PAC (PDF Accessibility Checker) ו/או "
    "בבדיקה ידנית של אדם עם מוגבלות המשתמש בקורא מסך."
)


def _lang_label(lang: str) -> str:
    return {"he": "עברית", "en": "אנגלית", "und": "לא זוהתה"}.get(lang, lang)


def render_html_report(report: AccessibilityReport) -> str:
    def esc(s: str) -> str:
        return html.escape(s)

    actions_html = "".join(f"<li>{esc(a)}</li>" for a in report.automated_actions) or (
        "<li>לא בוצעו פעולות אוטומטיות.</li>"
    )
    manual_html = "".join(f"<li>{esc(m)}</li>" for m in report.manual_review_items) or (
        "<li>לא זוהו פריטים הדורשים בדיקה ידנית נוספת.</li>"
    )
    warnings_html = "".join(f"<li>{esc(w)}</li>" for w in report.warnings)
    warnings_section = (
        f"""
        <section>
          <h2>הערות טכניות</h2>
          <ul class="warnings">{warnings_html}</ul>
        </section>
        """
        if report.warnings
        else ""
    )

    stats_rows = "".join(
        f"<tr><td>{esc(str(k))}</td><td>{esc(str(v))}</td></tr>"
        for k, v in report.stats.items()
    )

    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>דוח נגישות - {esc(report.source_filename)}</title>
<style>
  body {{ font-family: "Segoe UI", Arial, sans-serif; max-width: 820px; margin: 2rem auto;
         padding: 0 1rem; line-height: 1.6; color: #1c1c1e; }}
  h1 {{ font-size: 1.5rem; }}
  h2 {{ font-size: 1.15rem; border-bottom: 2px solid #ddd; padding-bottom: .25rem; margin-top: 2rem; }}
  table {{ border-collapse: collapse; width: 100%; margin: .5rem 0 1.5rem; }}
  td, th {{ border: 1px solid #ddd; padding: .4rem .6rem; text-align: right; }}
  ul {{ padding-inline-start: 1.4rem; }}
  li {{ margin: .3rem 0; }}
  .disclaimer {{ background: #fff4e5; border: 1px solid #f0b429; border-radius: 8px;
                 padding: 1rem 1.2rem; margin-top: 2rem; }}
  .manual li {{ color: #8a4b00; }}
  .warnings li {{ color: #8a1f11; }}
  .meta {{ color: #555; font-size: .9rem; }}
</style>
</head>
<body>
  <h1>דוח נגישות PDF</h1>
  <p class="meta">קובץ מקור: {esc(report.source_filename)} &middot; עמודים: {report.n_pages}
    &middot; PDF סרוק: {"כן" if report.is_scanned else "לא"} &middot; שפה שזוהתה: {_lang_label(report.language)}</p>

  <section>
    <h2>סטטיסטיקה</h2>
    <table>{stats_rows}</table>
  </section>

  <section>
    <h2>מה בוצע אוטומטית</h2>
    <ul>{actions_html}</ul>
  </section>

  <section>
    <h2>דורש בדיקה ידנית</h2>
    <ul class="manual">{manual_html}</ul>
  </section>

  {warnings_section}

  <div class="disclaimer">
    <strong>שימו לב:</strong> {esc(PAC_DISCLAIMER_HE)}
  </div>
</body>
</html>
"""


def render_pdf_report(report: AccessibilityReport, output_path: Path) -> None:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT
    from reportlab.lib.units import cm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

    try:
        from bidi.algorithm import get_display
    except ImportError:  # pragma: no cover
        get_display = lambda s: s  # noqa: E731

    font_path = find_unicode_font()
    font_name = "Helvetica"
    if font_path:
        try:
            pdfmetrics.registerFont(TTFont("ReportUnicode", font_path))
            font_name = "ReportUnicode"
        except Exception:  # noqa: BLE001
            font_name = "Helvetica"

    def rtl(text: str) -> str:
        return get_display(text)

    styles = {
        "title": ParagraphStyle("title", fontName=font_name, fontSize=18, alignment=TA_RIGHT, spaceAfter=14),
        "h2": ParagraphStyle("h2", fontName=font_name, fontSize=13, alignment=TA_RIGHT, spaceBefore=16, spaceAfter=6),
        "body": ParagraphStyle("body", fontName=font_name, fontSize=10.5, alignment=TA_RIGHT, leading=15),
        "item": ParagraphStyle("item", fontName=font_name, fontSize=10, alignment=TA_RIGHT, leading=14),
        "disclaimer": ParagraphStyle(
            "disclaimer", fontName=font_name, fontSize=10, alignment=TA_RIGHT, leading=14,
            borderPadding=8, backColor=HexColor("#fff4e5"),
        ),
    }

    story = []
    story.append(Paragraph(rtl("דוח נגישות PDF"), styles["title"]))
    meta = (
        f"קובץ מקור: {report.source_filename} | עמודים: {report.n_pages} | "
        f"PDF סרוק: {'כן' if report.is_scanned else 'לא'} | שפה: {_lang_label(report.language)}"
    )
    story.append(Paragraph(rtl(meta), styles["body"]))

    story.append(Paragraph(rtl("מה בוצע אוטומטית"), styles["h2"]))
    actions = report.automated_actions or ["לא בוצעו פעולות אוטומטיות."]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(rtl(a), styles["item"])) for a in actions],
            bulletType="bullet",
        )
    )

    story.append(Paragraph(rtl("דורש בדיקה ידנית"), styles["h2"]))
    manual = report.manual_review_items or ["לא זוהו פריטים הדורשים בדיקה ידנית נוספת."]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(rtl(m), styles["item"])) for m in manual],
            bulletType="bullet",
        )
    )

    if report.warnings:
        story.append(Paragraph(rtl("הערות טכניות"), styles["h2"]))
        story.append(
            ListFlowable(
                [ListItem(Paragraph(rtl(w), styles["item"])) for w in report.warnings],
                bulletType="bullet",
            )
        )

    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph(rtl(PAC_DISCLAIMER_HE), styles["disclaimer"]))

    doc = SimpleDocTemplate(
        str(output_path), pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm,
    )
    doc.build(story)
