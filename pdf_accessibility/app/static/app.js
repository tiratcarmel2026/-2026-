const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const filenameEl = document.getElementById("filename");
const processBtn = document.getElementById("processBtn");
const statusEl = document.getElementById("status");
const errorBox = document.getElementById("errorBox");
const resultCard = document.getElementById("resultCard");

let selectedFile = null;

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
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showError("יש לבחור קובץ בסיומת .pdf בלבד.");
    return;
  }
  selectedFile = file;
  filenameEl.textContent = file.name;
  processBtn.disabled = false;
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

processBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  hideError();
  resultCard.classList.add("hidden");
  statusEl.classList.remove("hidden");
  processBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const resp = await fetch("/api/process", { method: "POST", body: formData });
    const data = await resp.json();
    if (!resp.ok) {
      showError((data.error && data.error.message) || "אירעה שגיאה לא ידועה.");
      return;
    }
    renderResult(data);
  } catch (err) {
    showError("לא ניתן היה להתחבר לשרת. ודאו שהשרת המקומי פועל ונסו שוב.");
  } finally {
    statusEl.classList.add("hidden");
    processBtn.disabled = false;
  }
});

function renderResult(data) {
  document.getElementById("dlPdf").href = `/api/download/${data.job_id}/pdf`;
  document.getElementById("dlReportHtml").href = `/api/download/${data.job_id}/report-html`;
  document.getElementById("dlReportPdf").href = `/api/download/${data.job_id}/report-pdf`;

  const statsGrid = document.getElementById("statsGrid");
  statsGrid.innerHTML = "";
  for (const [label, value] of Object.entries(data.stats)) {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `<span class="n">${value}</span><span class="l">${label}</span>`;
    statsGrid.appendChild(div);
  }

  fillList("actionsList", data.automated_actions, "לא בוצעו פעולות אוטומטיות.");
  fillList("manualList", data.manual_review_items, "לא זוהו פריטים הדורשים בדיקה ידנית.");

  const warningsSection = document.getElementById("warningsSection");
  if (data.warnings && data.warnings.length) {
    fillList("warningsList", data.warnings, "");
    warningsSection.classList.remove("hidden");
  } else {
    warningsSection.classList.add("hidden");
  }

  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth" });
}

function fillList(elementId, items, emptyText) {
  const el = document.getElementById(elementId);
  el.innerHTML = "";
  if (!items || !items.length) {
    if (emptyText) {
      const li = document.createElement("li");
      li.textContent = emptyText;
      el.appendChild(li);
    }
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  }
}
