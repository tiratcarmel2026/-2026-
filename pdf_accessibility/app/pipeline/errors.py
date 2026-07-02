"""User-facing pipeline errors.

Every error raised here is meant to be caught at the API boundary and shown
to the user as a clear message - never a silent crash / bare 500.
"""
from __future__ import annotations


class AccessibilityPipelineError(Exception):
    """Base class for errors that should be shown to the user as-is."""

    def __init__(self, message: str, *, code: str = "processing_error"):
        super().__init__(message)
        self.message = message
        self.code = code


class FileTooLargeError(AccessibilityPipelineError):
    def __init__(self, size_mb: float, max_mb: int):
        super().__init__(
            f"הקובץ גדול מדי ({size_mb:.1f}MB). הגודל המרבי הנתמך הוא {max_mb}MB.",
            code="file_too_large",
        )


class TooManyPagesError(AccessibilityPipelineError):
    def __init__(self, pages: int, max_pages: int):
        super().__init__(
            f"הקובץ מכיל {pages} עמודים, מעבר למגבלה של {max_pages} עמודים למערכת מקומית זו.",
            code="too_many_pages",
        )


class EncryptedPDFError(AccessibilityPipelineError):
    def __init__(self):
        super().__init__(
            "הקובץ מוצפן / מוגן בסיסמה. יש להסיר את ההצפנה לפני העלאה (למשל דרך "
            "Acrobat או qpdf --decrypt) ולנסות שוב.",
            code="encrypted",
        )


class CorruptPDFError(AccessibilityPipelineError):
    def __init__(self, detail: str = ""):
        msg = "לא ניתן לקרוא את הקובץ - הוא כנראה פגום או שאינו PDF תקין."
        if detail:
            msg += f" ({detail})"
        super().__init__(msg, code="corrupt_file")


class NotAPDFError(AccessibilityPipelineError):
    def __init__(self):
        super().__init__(
            "הקובץ שהועלה אינו PDF (חתימת הקובץ אינה תואמת).", code="not_a_pdf"
        )


class EmptyPDFError(AccessibilityPipelineError):
    def __init__(self):
        super().__init__("הקובץ אינו מכיל עמודים.", code="empty_pdf")
