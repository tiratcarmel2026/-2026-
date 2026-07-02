"use client";

import { useState, type FormEvent } from "react";
import { formatHebrewDate } from "@/lib/format";
import { IconAlertCircle, IconCheckCircle } from "@/lib/icons";

interface CancelledInfo {
  departmentName: string;
  date: string;
  time: string;
}

export function CancelClient() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CancelledInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "NOT_FOUND") {
          setError("לא נמצא תור תואם. ודאו שהזנתם את מספר הטלפון והקוד הנכונים.");
        } else {
          setError("אנא הזינו מספר טלפון תקין וקוד ביטול.");
        }
        return;
      }
      setResult(data.appointment);
    } catch {
      setError("אירעה שגיאת תקשורת, נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
          <IconCheckCircle className="size-6" />
        </span>
        <h2 className="mb-1 text-lg font-bold text-gray-800">התור בוטל בהצלחה</h2>
        <p className="text-gray-600">
          {result.departmentName} · {formatHebrewDate(result.date)} בשעה {result.time}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">טלפון</label>
        <input
          required
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
          autoComplete="tel"
        />
      </div>
      <div>
        <label className="label">קוד ביטול</label>
        <input
          required
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-brand-red">
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-secondary w-full">
        {submitting ? "מבטל..." : "ביטול תור"}
      </button>
    </form>
  );
}
