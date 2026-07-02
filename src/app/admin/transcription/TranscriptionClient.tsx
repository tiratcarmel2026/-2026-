"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import type { TranscriptionJob, TranscriptionJobStatus } from "@/lib/types";

interface JobSummary {
  id: string;
  original_filename: string;
  status: TranscriptionJobStatus;
  progress_stage: string | null;
  progress_percent: number;
  error_message: string | null;
  duration_seconds: number | null;
  speaker_names: Record<string, string>;
  created_at: string;
}

const STATUS_LABEL: Record<TranscriptionJobStatus, string> = {
  pending_upload: "ממתין להעלאה",
  pending: "בתור לתמלול",
  processing: "מתמלל...",
  done: "הושלם",
  failed: "נכשל",
};

const STAGE_LABEL: Record<string, string> = {
  transcribing: "מתמלל דיבור",
  diarizing: "מזהה דוברים",
  naming_speakers: "מנחש שמות דוברים",
  finalizing: "משלים",
};

function isActive(status: TranscriptionJobStatus): boolean {
  return status === "pending" || status === "processing" || status === "pending_upload";
}

export function TranscriptionClient() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [selectedJobLoading, setSelectedJobLoading] = useState(false);
  const [speakerDrafts, setSpeakerDrafts] = useState<Record<string, string>>({});
  const [savingSpeaker, setSavingSpeaker] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/transcription/jobs");
    if (!res.ok) {
      if (res.status === 401) setLoggedIn(false);
      return;
    }
    const data = await res.json();
    setJobs(data.jobs ?? []);
  }, []);

  const loadSelectedJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/transcription/jobs/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setSelectedJob(data.job);
    setSpeakerDrafts(data.job.speaker_names ?? {});
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: "transcription", password }),
      });
      if (!res.ok) {
        setLoginError("סיסמה שגויה");
        return;
      }
      setLoggedIn(true);
      await loadJobs();
    } catch {
      setLoginError("אירעה שגיאת תקשורת, נסו שוב.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: "transcription" }),
    });
    setLoggedIn(false);
    setJobs([]);
    setSelectedJob(null);
    setPassword("");
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const createRes = await fetch("/api/transcription/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!createRes.ok) throw new Error("create-failed");
      const { jobId, bucket, path, token } = await createRes.json();

      const { error: uploadErr } = await getSupabaseBrowser()
        .storage.from(bucket)
        .uploadToSignedUrl(path, token, file);
      if (uploadErr) throw uploadErr;

      const markRes = await fetch(`/api/transcription/jobs/${jobId}/uploaded`, {
        method: "POST",
      });
      if (!markRes.ok) throw new Error("mark-failed");

      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadJobs();
    } catch {
      setUploadError(
        "העלאת הקובץ נכשלה. ודאו שהוגדרו NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, ושמגבלת גודל הקובץ ב-Supabase Storage הועלתה מעל גודל ההקלטה."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק את ההקלטה והתמלול לצמיתות?")) return;
    await fetch(`/api/transcription/jobs/${id}`, { method: "DELETE" });
    if (selectedJob?.id === id) setSelectedJob(null);
    await loadJobs();
  }

  async function handleSaveSpeaker(speaker: string) {
    if (!selectedJob) return;
    setSavingSpeaker(speaker);
    try {
      const res = await fetch(`/api/transcription/jobs/${selectedJob.id}/speakers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker, name: speakerDrafts[speaker] ?? "" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedJob({ ...selectedJob, speaker_names: data.speaker_names });
      }
    } finally {
      setSavingSpeaker(null);
    }
  }

  // Poll while logged in: refresh the job list, and the open job's detail if
  // it's still being processed (transcription can take a long time for a
  // 3-4 hour recording).
  useEffect(() => {
    if (!loggedIn) return;
    const interval = setInterval(() => {
      loadJobs();
      if (selectedJob && isActive(selectedJob.status)) {
        loadSelectedJob(selectedJob.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loggedIn, selectedJob, loadJobs, loadSelectedJob]);

  if (!loggedIn) {
    return (
      <form onSubmit={handleLogin} className="max-w-sm space-y-4">
        <div>
          <label className="block mb-1 font-medium">סיסמה</label>
          <input
            required
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
        <button
          type="submit"
          disabled={loginLoading}
          className="rounded-lg bg-brand-blue px-5 py-2 text-white font-medium disabled:opacity-50"
        >
          {loginLoading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            required
            className="text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-brand-blue px-5 py-2 text-white font-medium disabled:opacity-50"
          >
            {uploading ? "מעלה..." : "העלאה ותמלול"}
          </button>
        </form>
        <button onClick={handleLogout} className="rounded-lg border px-4 py-2 text-sm font-medium">
          התנתקות
        </button>
      </div>
      {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}

      <div>
        <h2 className="font-bold mb-3">הקלטות</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">קובץ</th>
                <th className="p-3">סטטוס</th>
                <th className="p-3">הועלה</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="p-3">{job.original_filename}</td>
                  <td className="p-3">
                    {STATUS_LABEL[job.status]}
                    {job.status === "processing" && (
                      <span className="text-gray-500">
                        {" "}
                        ({job.progress_stage ? STAGE_LABEL[job.progress_stage] ?? job.progress_stage : ""}
                        {job.progress_percent ? ` ${job.progress_percent}%` : ""})
                      </span>
                    )}
                    {job.status === "failed" && job.error_message && (
                      <span className="text-red-600 block text-xs">{job.error_message}</span>
                    )}
                  </td>
                  <td className="p-3">{new Date(job.created_at).toLocaleString("he-IL")}</td>
                  <td className="p-3 flex gap-2">
                    {job.status === "done" && (
                      <button
                        className="text-brand-blue underline"
                        onClick={async () => {
                          setSelectedJobLoading(true);
                          await loadSelectedJob(job.id);
                          setSelectedJobLoading(false);
                        }}
                      >
                        צפייה
                      </button>
                    )}
                    <button className="text-red-600 underline" onClick={() => handleDelete(job.id)}>
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <p className="p-4 text-center text-gray-500">עדיין לא הועלו הקלטות.</p>
          )}
        </div>
      </div>

      {selectedJobLoading && <p>טוען תמלול...</p>}

      {selectedJob && selectedJob.transcript && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{selectedJob.original_filename}</h2>
            <div className="flex gap-2">
              <a
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                href={`/api/transcription/jobs/${selectedJob.id}/export?format=txt`}
              >
                ייצוא TXT
              </a>
              <a
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                href={`/api/transcription/jobs/${selectedJob.id}/export?format=srt`}
              >
                ייצוא SRT
              </a>
              <a
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                href={`/api/transcription/jobs/${selectedJob.id}/export?format=docx`}
              >
                ייצוא Word
              </a>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">שמות דוברים</h3>
            <p className="text-gray-500 text-sm mb-2">
              השמות נוחשו אוטומטית מתוך הצגה עצמית בהקלטה (אם הייתה) - בדקו ותקנו לפי הצורך.
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedJob.transcript.speakers.map((speaker, i) => (
                <div key={speaker} className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">דובר {i + 1}:</span>
                  <input
                    className="input !w-40 !py-1"
                    value={speakerDrafts[speaker] ?? ""}
                    onChange={(e) =>
                      setSpeakerDrafts({ ...speakerDrafts, [speaker]: e.target.value })
                    }
                    onBlur={() => handleSaveSpeaker(speaker)}
                  />
                  {savingSpeaker === speaker && (
                    <span className="text-xs text-gray-400">שומר...</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white divide-y max-h-[32rem] overflow-y-auto">
            {selectedJob.transcript.segments.map((segment, i) => {
              const speakerIndex = selectedJob.transcript!.speakers.indexOf(segment.speaker);
              const name =
                selectedJob.speaker_names[segment.speaker] || `דובר ${speakerIndex + 1}`;
              return (
                <div key={i} className="p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(segment.start * 1000).toISOString().substring(11, 19)} · {name}
                  </div>
                  <p>{segment.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
