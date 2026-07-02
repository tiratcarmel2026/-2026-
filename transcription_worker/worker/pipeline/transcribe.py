"""Hebrew speech-to-text using faster-whisper (CTranslate2)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable

from .. import config

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        logger.info("Loading Whisper model %s on %s", config.WHISPER_MODEL, config.WHISPER_DEVICE)
        _model = WhisperModel(
            config.WHISPER_MODEL,
            device=config.WHISPER_DEVICE,
            compute_type=config.WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe(
    audio_path: Path,
    on_progress: Callable[[float, float], None] | None = None,
) -> tuple[list[dict], float]:
    """Returns (segments, duration_seconds). Each segment is
    {"start": float, "end": float, "text": str}.
    """
    model = _get_model()
    segments_iter, info = model.transcribe(
        str(audio_path),
        language="he",
        vad_filter=True,
        word_timestamps=False,
    )

    segments: list[dict] = []
    for segment in segments_iter:
        text = segment.text.strip()
        if not text:
            continue
        segments.append({"start": segment.start, "end": segment.end, "text": text})
        if on_progress and info.duration:
            on_progress(segment.end, info.duration)

    return segments, info.duration
