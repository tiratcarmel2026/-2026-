"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/yizkor-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "שגיאה בשליחת הפנייה");
      }

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "שגיאה בשליחת הפנייה");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-yizkor-border bg-yizkor-card p-6 text-center">
        <p className="text-lg font-semibold text-yizkor-gold">
          הפנייה נשלחה בהצלחה
        </p>
        <p className="text-white/80 mt-2">נציגי העירייה יחזרו אליכם בהקדם.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-yizkor-border bg-yizkor-card p-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm text-white/80">
          שם מלא
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-lg bg-white/5 border border-yizkor-border px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yizkor-gold"
          placeholder="שם פרטי ומשפחה"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-white/80">
          דוא&quot;ל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg bg-white/5 border border-yizkor-border px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yizkor-gold"
          placeholder="name@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm text-white/80">
          טלפון (לא חובה)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="rounded-lg bg-white/5 border border-yizkor-border px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yizkor-gold"
          placeholder="050-0000000"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm text-white/80">
          תוכן הפנייה
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="rounded-lg bg-white/5 border border-yizkor-border px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yizkor-gold resize-none"
          placeholder="כתבו כאן את פנייתכם..."
        />
      </div>

      {status === "error" && (
        <p className="text-red-300 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-2 rounded-lg bg-yizkor-gold text-[#1a1204] font-bold py-2.5 hover:opacity-90 transition disabled:opacity-60"
      >
        {status === "sending" ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
