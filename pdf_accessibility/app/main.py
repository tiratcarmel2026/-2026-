"""FastAPI app: upload a PDF, run the accessibility pipeline, download results."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .pipeline.errors import AccessibilityPipelineError
from .pipeline.runner import process_pdf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdf_accessibility")

app = FastAPI(title="מערכת הנגשת PDF")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_STATIC_DIR = Path(__file__).parent / "static"

# job_id -> output directory, kept in-memory (single-user local tool).
_JOBS: dict[str, Path] = {}


@app.get("/")
def index():
    return FileResponse(_STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


@app.post("/api/process")
async def api_process(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail={"code": "not_a_pdf", "message": "יש להעלות קובץ עם סיומת .pdf בלבד."})

    job_id = uuid.uuid4().hex
    upload_path = config.UPLOAD_DIR / f"{job_id}.pdf"
    job_dir = config.OUTPUT_DIR / job_id

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
                        content={
                            "error": {
                                "code": "file_too_large",
                                "message": f"הקובץ גדול מדי. הגודל המרבי הנתמך הוא {config.MAX_FILE_SIZE_MB}MB.",
                            }
                        },
                    )
                f.write(chunk)
    finally:
        await file.close()

    try:
        result = process_pdf(upload_path, file.filename, job_dir)
    except AccessibilityPipelineError as exc:
        logger.warning("Pipeline error for %s: %s", file.filename, exc.message)
        return JSONResponse(
            status_code=422, content={"error": {"code": exc.code, "message": exc.message}}
        )
    except Exception:  # noqa: BLE001 - never expose a raw traceback / bare 500 to the user
        logger.exception("Unexpected failure processing %s", file.filename)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_error",
                    "message": "אירעה שגיאה לא צפויה בעיבוד הקובץ. נסו קובץ אחר או פנו לפרטים בלוג השרת.",
                }
            },
        )
    finally:
        upload_path.unlink(missing_ok=True)

    _JOBS[job_id] = job_dir

    r = result.report
    return {
        "job_id": job_id,
        "n_pages": r.n_pages,
        "is_scanned": r.is_scanned,
        "language": r.language,
        "stats": r.stats,
        "automated_actions": r.automated_actions,
        "manual_review_items": r.manual_review_items,
        "warnings": r.warnings,
    }


def _job_dir_or_404(job_id: str) -> Path:
    job_dir = _JOBS.get(job_id)
    if job_dir is None or not job_dir.exists():
        raise HTTPException(status_code=404, detail="העבודה לא נמצאה (ייתכן שהשרת הופעל מחדש).")
    return job_dir


@app.get("/api/download/{job_id}/pdf")
def download_pdf(job_id: str):
    job_dir = _job_dir_or_404(job_id)
    return FileResponse(
        job_dir / "accessible.pdf",
        media_type="application/pdf",
        filename="accessible.pdf",
    )


@app.get("/api/download/{job_id}/report-html")
def download_report_html(job_id: str):
    job_dir = _job_dir_or_404(job_id)
    return FileResponse(
        job_dir / "accessibility_report.html",
        media_type="text/html",
        filename="accessibility_report.html",
    )


@app.get("/api/download/{job_id}/report-pdf")
def download_report_pdf(job_id: str):
    job_dir = _job_dir_or_404(job_id)
    return FileResponse(
        job_dir / "accessibility_report.pdf",
        media_type="application/pdf",
        filename="accessibility_report.pdf",
    )
