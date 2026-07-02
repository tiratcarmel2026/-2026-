FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker ./worker

# CPU by default (works everywhere, but slow for hours-long audio). For GPU,
# build on top of an nvidia/cuda base image instead and set
# WHISPER_DEVICE=cuda / DIARIZATION_DEVICE=cuda - see README.md.
ENV WHISPER_DEVICE=cpu \
    DIARIZATION_DEVICE=cpu \
    WHISPER_COMPUTE_TYPE=int8

CMD ["python", "-m", "worker.main"]
