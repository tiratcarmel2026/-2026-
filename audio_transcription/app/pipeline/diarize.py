"""Speaker diarization (who spoke when) using pyannote.audio.

Requires a Hugging Face token with access to the gated models - accept the
terms at https://huggingface.co/pyannote/speaker-diarization-3.1 and
https://huggingface.co/pyannote/segmentation-3.0 first.
"""
from __future__ import annotations

import logging
from pathlib import Path

from .. import config

logger = logging.getLogger(__name__)

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from pyannote.audio import Pipeline

        logger.info("Loading diarization model %s", config.DIARIZATION_MODEL)
        _pipeline = Pipeline.from_pretrained(
            config.DIARIZATION_MODEL, use_auth_token=config.HF_TOKEN or None
        )
        if config.DIARIZATION_DEVICE == "cuda":
            import torch

            _pipeline.to(torch.device("cuda"))
    return _pipeline


def diarize(audio_path: Path) -> list[dict]:
    """Returns a list of {"start": float, "end": float, "speaker": str}."""
    pipeline = _get_pipeline()
    diarization = pipeline(str(audio_path))

    turns = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        turns.append({"start": turn.start, "end": turn.end, "speaker": speaker})
    return turns
