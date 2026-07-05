"""FastAPI app: upload a Hebrew recording, transcribe it with speaker
diarization in the background, and download the result.
"""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles

from . import config
from .pipeline import runner
from .pipeline.docx_export import build_docx
from .pipeline.export import build_plain_text, build_srt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audio_transcription")

app = FastAPI(title="תמלול הקלטות בעברית")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_STATIC_DIR = Path(__file__).parent / "static"


@app.get("/")
def index():
    return FileResponse(_STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


def _job_or_404(job_id: str) -> runner.TranscriptionJob:
    job = runner.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="העבודה לא נמצאה (ייתכן שהשרת הופעל מחדש).")
    return job


@app.post("/api/upload")
async def api_upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="חסר שם קובץ.")

    job_id = uuid.uuid4().hex
    suffix = Path(file.filename).suffix or ".audio"
    upload_path = config.UPLOAD_DIR / f"{job_id}{suffix}"

    try:
        size = 0
        with upload_path.open("wb") as f:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > config.MAX_FILE_SIZE_BYTES:
                    f.close()
                    upload_path.unlink(missing_ok=True)
                    return JSONResponse(
                        status_code=413,
                        content={"error": f"הקובץ גדול מדי. הגודל המרבי הנתמך הוא {config.MAX_FILE_SIZE_MB}MB."},
                    )
                f.write(chunk)
    finally:
        await file.close()

    runner.create_job(job_id, file.filename)
    background_tasks.add_task(runner.run_job, job_id, upload_path)

    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
def api_status(job_id: str):
    job = _job_or_404(job_id)
    return {
        "status": job.status,
        "stage": job.stage,
        "percent": job.percent,
        "error": job.error,
        "original_filename": job.original_filename,
        "duration_seconds": job.duration_seconds,
    }


@app.get("/api/transcript/{job_id}")
def api_transcript(job_id: str):
    job = _job_or_404(job_id)
    if job.status != "done":
        raise HTTPException(status_code=409, detail="התמלול עדיין לא הושלם.")
    return {
        "transcript": job.transcript,
        "speaker_names": job.speaker_names,
        "original_filename": job.original_filename,
    }


@app.patch("/api/transcript/{job_id}/speakers")
async def api_rename_speaker(job_id: str, request: Request):
    body = await request.json()
    speaker = body.get("speaker")
    name = body.get("name", "")
    if not speaker or not isinstance(name, str):
        raise HTTPException(status_code=400, detail="חסרים פרמטרים.")

    speaker_names = runner.rename_speaker(job_id, speaker, name)
    if speaker_names is None:
        raise HTTPException(status_code=404, detail="העבודה לא נמצאה.")
    return {"speaker_names": speaker_names}


@app.get("/api/download/{job_id}/{fmt}")
def api_download(job_id: str, fmt: str):
    job = _job_or_404(job_id)
    if job.status != "done" or job.transcript is None:
        raise HTTPException(status_code=409, detail="התמלול עדיין לא הושלם.")

    base_name = Path(job.original_filename).stem

    if fmt == "txt":
        text = build_plain_text(job.transcript, job.speaker_names, job.original_filename)
        return PlainTextResponse(
            text,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.txt"'},
        )
    if fmt == "srt":
        srt = build_srt(job.transcript, job.speaker_names)
        return PlainTextResponse(
            srt,
            media_type="application/x-subrip; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.srt"'},
        )
    if fmt == "docx":
        data = build_docx(job.transcript, job.speaker_names, job.original_filename)
        return Response(
            data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.docx"'},
        )

    raise HTTPException(status_code=400, detail="פורמט לא נתמך (txt/srt/docx בלבד).")
