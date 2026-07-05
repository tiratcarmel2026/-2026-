const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const filenameEl = document.getElementById("filename");
const uploadBtn = document.getElementById("uploadBtn");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const errorBox = document.getElementById("errorBox");
const resultCard = document.getElementById("resultCard");

const STAGE_LABEL = {
  transcribing: "מתמלל דיבור",
  diarizing: "מזהה דוברים",
  naming_speakers: "מנחש שמות דוברים",
  finalizing: "משלים",
  done: "הושלם",
};

let selectedFile = null;
let pollTimer = null;

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drag"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag");
  if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) setFile(fileInput.files[0]);
});

function setFile(file) {
  selectedFile = file;
  filenameEl.textContent = file.name;
  uploadBtn.disabled = false;
  hideError();
  resultCard.classList.add("hidden");
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}
function hideError() {
  errorBox.classList.add("hidden");
}

uploadBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  hideError();
  resultCard.classList.add("hidden");
  uploadBtn.disabled = true;
  statusEl.classList.remove("hidden");
  statusTextEl.textContent = "מעלה קובץ...";
  progressBar.classList.add("hidden");

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const resp = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await resp.json();
    if (!resp.ok) {
      showError(data.detail || data.error || "אירעה שגיאה בהעלאה.");
      resetUploadUi();
      return;
    }
    progressBar.classList.remove("hidden");
    pollStatus(data.job_id);
  } catch (err) {
    showError("לא ניתן היה להתחבר לשרת. נסו שוב.");
    resetUploadUi();
  }
});

function resetUploadUi() {
  statusEl.classList.add("hidden");
  progressBar.classList.add("hidden");
  uploadBtn.disabled = false;
}

function pollStatus(jobId) {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const resp = await fetch(`/api/status/${jobId}`);
      const data = await resp.json();
      if (!resp.ok) {
        clearInterval(pollTimer);
        showError(data.detail || "העבודה לא נמצאה.");
        resetUploadUi();
        return;
      }

      if (data.status === "failed") {
        clearInterval(pollTimer);
        showError(`התמלול נכשל: ${data.error || "שגיאה לא ידועה"}`);
        resetUploadUi();
        return;
      }

      const label = STAGE_LABEL[data.stage] || data.stage;
      statusTextEl.textContent = `${label}... ${data.percent}%`;
      progressFill.style.width = `${data.percent}%`;

      if (data.status === "done") {
        clearInterval(pollTimer);
        await loadTranscript(jobId, data.original_filename);
        resetUploadUi();
      }
    } catch (err) {
      // transient network error - keep polling
    }
  }, 4000);
}

async function loadTranscript(jobId, originalFilename) {
  const resp = await fetch(`/api/transcript/${jobId}`);
  const data = await resp.json();
  if (!resp.ok) {
    showError(data.detail || "לא ניתן לטעון את התמלול.");
    return;
  }
  renderResult(jobId, data);
}

function renderResult(jobId, data) {
  document.getElementById("resultFilename").textContent = data.original_filename;
  document.getElementById("dlTxt").href = `/api/download/${jobId}/txt`;
  document.getElementById("dlSrt").href = `/api/download/${jobId}/srt`;
  document.getElementById("dlDocx").href = `/api/download/${jobId}/docx`;

  const speakers = data.transcript.speakers;
  const speakerNames = data.speaker_names || {};

  const speakersList = document.getElementById("speakersList");
  speakersList.innerHTML = "";
  speakers.forEach((speaker, i) => {
    const row = document.createElement("div");
    row.className = "speaker-row";

    const label = document.createElement("span");
    label.className = "speaker-label";
    label.textContent = `דובר ${i + 1}:`;

    const input = document.createElement("input");
    input.type = "text";
    input.value = speakerNames[speaker] || "";
    input.placeholder = `דובר ${i + 1}`;
    input.addEventListener("blur", () => renameSpeaker(jobId, speaker, input.value));

    row.appendChild(label);
    row.appendChild(input);
    speakersList.appendChild(row);
  });

  renderSegments(data.transcript, speakerNames);
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth" });
}

function displayName(speaker, speakerNames, speakers) {
  const custom = (speakerNames[speaker] || "").trim();
  if (custom) return custom;
  const idx = speakers.indexOf(speaker);
  return `דובר ${idx + 1}`;
}

function formatTimestamp(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function renderSegments(transcript, speakerNames) {
  const container = document.getElementById("segmentsList");
  container.innerHTML = "";
  for (const segment of transcript.segments) {
    const name = displayName(segment.speaker, speakerNames, transcript.speakers);
    const div = document.createElement("div");
    div.className = "segment";
    div.innerHTML = `<div class="segment-meta">${formatTimestamp(segment.start)} · ${name}</div><p>${segment.text}</p>`;
    container.appendChild(div);
  }
}

async function renameSpeaker(jobId, speaker, name) {
  const resp = await fetch(`/api/transcript/${jobId}/speakers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speaker, name }),
  });
  if (!resp.ok) return;
  const data = await resp.json();
  const transcriptResp = await fetch(`/api/transcript/${jobId}`);
  const transcriptData = await transcriptResp.json();
  renderSegments(transcriptData.transcript, data.speaker_names);
}
