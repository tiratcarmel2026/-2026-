"""Document-level accessibility metadata: title, language, mark info."""
from __future__ import annotations

import pikepdf
from pikepdf import Dictionary, Name, String


def apply_metadata(pdf: pikepdf.Pdf, title: str, language: str) -> None:
    pdf.Root["/Lang"] = String(language)

    if "/MarkInfo" in pdf.Root:
        pdf.Root["/MarkInfo"]["/Marked"] = True
    else:
        pdf.Root["/MarkInfo"] = Dictionary({"/Marked": True})

    vp = pdf.Root.get("/ViewerPreferences")
    if vp is None:
        vp = Dictionary({})
        pdf.Root["/ViewerPreferences"] = vp
    pdf.Root["/ViewerPreferences"]["/DisplayDocTitle"] = True

    with pdf.open_metadata() as meta:
        if title:
            meta["dc:title"] = title
        meta["dc:language"] = language

    if title:
        pdf.docinfo["/Title"] = String(title)
