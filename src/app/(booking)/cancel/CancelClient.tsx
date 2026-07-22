"use client";

import { useState, type FormEvent } from "react";
import { formatHebrewDate } from "@/lib/format";

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
      <div className="rounded-xl border border-brand-green bg-green-50 p-6 text-center">
        <h2 className="text-lg font-bold text-brand-green-dark mb-2">התור בוטל בהצלחה</h2>
        <p>
          {result.departmentName} · {formatHebrewDate(result.date)} בשעה {result.time}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">טלפון</label>
        <input
          required
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">קוד ביטול</label>
        <input
          required
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-brand-blue px-5 py-2 text-white font-medium disabled:opacity-50"
      >
        {submitting ? "מבטל..." : "ביטול תור"}
      </button>
    </form>
  );
}
