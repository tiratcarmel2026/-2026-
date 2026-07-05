"""Best-effort real-name guessing for speaker labels, using Claude to read
the transcript for self-introductions / other speakers addressing someone
by name (e.g. "שלום, מדבר יוסי כהן" or "תודה, דנה"). This is a heuristic -
it only finds a name if the conversation actually contains one; otherwise
the speaker keeps its default "דובר N" label (handled by the frontend/export).
"""
from __future__ import annotations

import json
import logging

from .. import config

logger = logging.getLogger(__name__)

_PROMPT = """להלן תמלול אוטומטי של שיחה בעברית, מחולק לפי דוברים. תוויות הדוברים
(SPEAKER_00, SPEAKER_01 וכו') הן זיהוי קולי אוטומטי בלבד - הן לא בהכרח
עקביות או נכונות, ואינן קשורות לשמות אמיתיים.

המשימה שלך: לזהות את השם האמיתי של כל דובר, רק אם יש לכך רמז ברור בטקסט
עצמו (הצגה עצמית כמו "שלום, מדבר X", פנייה של דובר אחר בשם, חתימה בסוף
פנייה, וכדומה). אל תנחש שמות שאין להם עיגון בטקסט.

החזר אך ורק אובייקט JSON תקין (בלי טקסט נוסף, בלי markdown), במבנה:
{"SPEAKER_00": "שם מלא או null", "SPEAKER_01": "שם מלא או null", ...}

התמלול:
"""


def _format_transcript_for_prompt(segments: list[dict]) -> str:
    lines = [f'{seg["speaker"]}: {seg["text"]}' for seg in segments]
    text = "\n".join(lines)
    if len(text) > config.MAX_TRANSCRIPT_CHARS_FOR_NAMING:
        text = text[: config.MAX_TRANSCRIPT_CHARS_FOR_NAMING]
    return text


def guess_speaker_names(segments: list[dict], speakers: list[str]) -> dict[str, str]:
    if not config.ANTHROPIC_API_KEY:
        return {}

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        prompt = _PROMPT + _format_transcript_for_prompt(segments)
        response = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = "".join(
            block.text for block in response.content if getattr(block, "type", "") == "text"
        ).strip()
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()
        guessed = json.loads(raw)
    except Exception as exc:  # noqa: BLE001 - naming is best-effort, must not fail the job
        logger.warning("Speaker name guessing failed: %s", exc)
        return {}

    names = {}
    for speaker in speakers:
        name = guessed.get(speaker)
        if isinstance(name, str) and name.strip() and name.strip().lower() != "null":
            names[speaker] = name.strip()
    return names
