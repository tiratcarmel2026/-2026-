"""Generate alt-text for extracted figures using the Claude API (vision)."""
from __future__ import annotations

import base64
import logging

from .. import config
from .models import FigureInfo

logger = logging.getLogger(__name__)

_FALLBACK_TEXT = {
    "he": "תמונה (לא זוהה תיאור אוטומטי - נדרש תיאור ידני)",
    "en": "Image (automatic description unavailable - needs manual alt text)",
}

_PROMPT = {
    "he": (
        "זוהי תמונה שנמצאת בתוך מסמך PDF. כתוב תיאור alt-text קצר, מדויק "
        "ותיאורי בעברית עבור קוראי מסך, עד כ-20 מילים. אל תתחיל ב'תמונה של' "
        "או 'איור של'. אם זהו לוגו, גרף, תרשים או טבלה בתמונה - ציין זאת ותאר "
        "את המידע המהותי שבו. השב אך ורק עם הטקסט של ה-alt, בלי מרכאות "
        "ובלי הסברים נוספים."
    ),
    "en": (
        "This image appears inside a PDF document. Write a short, precise, "
        "descriptive alt-text for screen reader users, at most ~20 words. "
        "Do not start with 'image of' or 'picture of'. If it is a logo, "
        "chart, diagram or table, say so and describe the key information. "
        "Reply with only the alt-text itself, no quotes, no extra commentary."
    ),
}


def _get_client():
    if not config.ANTHROPIC_API_KEY:
        return None
    import anthropic

    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def generate_alt_text_for_figure(figure: FigureInfo, client, language: str) -> None:
    lang = language if language in _PROMPT else "en"
    if client is None:
        figure.alt_text = _FALLBACK_TEXT[lang]
        figure.alt_source = "none"
        return

    b64 = base64.standard_b64encode(figure.png_bytes).decode("ascii")
    try:
        response = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": _PROMPT[lang]},
                    ],
                }
            ],
        )
        text = "".join(
            block.text for block in response.content if getattr(block, "type", "") == "text"
        ).strip()
        text = text.strip('"').strip("'").strip()
        if not text:
            raise ValueError("empty response")
        figure.alt_text = text
        figure.alt_source = "claude"
    except Exception as exc:  # noqa: BLE001 - one failed image must not break the pipeline
        logger.warning("Alt-text generation failed for xref=%s: %s", figure.xref, exc)
        figure.alt_text = _FALLBACK_TEXT[lang]
        figure.alt_source = "fallback"


def generate_alt_text_for_all(figures: list[FigureInfo], language: str) -> None:
    client = _get_client()
    limit = config.MAX_IMAGES_FOR_ALT_TEXT
    for i, figure in enumerate(figures):
        if i >= limit:
            lang = language if language in _FALLBACK_TEXT else "en"
            figure.alt_text = _FALLBACK_TEXT[lang]
            figure.alt_source = "none"
            continue
        generate_alt_text_for_figure(figure, client, language)
