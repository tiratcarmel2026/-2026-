"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Department, SlotInfo } from "@/lib/types";
import { formatHebrewDate } from "@/lib/format";

type Step = "select" | "form" | "confirmed";

interface Props {
  department: Department;
  minDate: string;
  maxDate: string;
}

interface HoldInfo {
  holderId: string;
  expiresAt: string;
  date: string;
  time: string;
}

interface ConfirmedInfo {
  departmentName: string;
  date: string;
  time: string;
  code: string;
}

export function BookingClient({ department, minDate, maxDate }: Props) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("select");
  const [hold, setHold] = useState<HoldInfo | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [form, setForm] = useState({ name: "", phone: "", email: "", reason: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmed, setConfirmed] = useState<ConfirmedInfo | null>(null);

  const fetchSlots = useCallback(
    async (selectedDate: string) => {
      if (!selectedDate) {
        setSlots([]);
        return;
      }
      setLoadingSlots(true);
      setSlotsError(null);
      try {
        const res = await fetch(
          `/api/slots?departmentId=${department.id}&date=${selectedDate}`
        );
        const data = await res.json();
        if (!res.ok) {
          setSlotsError("שגיאה בטעינת השעות הפנויות");
          setSlots([]);
        } else {
          setSlots(data.slots ?? []);
        }
      } catch {
        setSlotsError("שגיאה בטעינת השעות הפנויות");
      } finally {
        setLoadingSlots(false);
      }
    },
    [department.id]
  );

  useEffect(() => {
    // fetchSlots sets loading/slots state - that's the point of this effect
    // (refetch whenever the selected date changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSlots(date);
  }, [date, fetchSlots]);

  useEffect(() => {
    if (step !== "form" || !hold) return;
    const tick = () => {
      const secs = Math.max(
        0,
        Math.round((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(secs);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, hold]);

  async function handleSelectSlot(time: string) {
    try {
      const res = await fetch("/api/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: department.id, date, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "SLOT_TAKEN") {
          alert("התור הזה נתפס הרגע לפני שהספקתם, אנא בחרו שעה אחרת.");
        } else {
          alert("אירעה שגיאה, נסו שוב.");
        }
        fetchSlots(date);
        return;
      }
      setHold({ holderId: data.holderId, expiresAt: data.expiresAt, date, time });
      setStep("form");
    } catch {
      alert("אירעה שגיאת תקשורת, נסו שוב.");
    }
  }

  function handleHoldExpired() {
    alert("הזמן להשלמת ההזמנה הסתיים. אנא בחרו שעה מחדש.");
    setHold(null);
    setStep("select");
    fetchSlots(date);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hold) return;
    setFormError(null);

    if (remainingSeconds <= 0) {
      handleHoldExpired();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holderId: hold.holderId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "HOLD_EXPIRED") {
          handleHoldExpired();
        } else if (data.error === "INVALID_PARAMS") {
          setFormError("אנא ודאו שכל השדות תקינים (כולל מספר טלפון ואימייל תקינים).");
        } else {
          setFormError("אירעה שגיאה, נסו שוב.");
        }
        return;
      }
      setConfirmed(data.appointment);
      setStep("confirmed");
    } catch {
      setFormError("אירעה שגיאת תקשורת, נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirmed" && confirmed) {
    return (
      <div className="rounded-xl border border-brand-green bg-green-50 p-6 text-center">
        <h2 className="text-xl font-bold text-brand-green-dark mb-2">התור נקבע בהצלחה!</h2>
        <p className="mb-1">
          {formatHebrewDate(confirmed.date)} בשעה {confirmed.time}
        </p>
        <p className="mb-4">{confirmed.departmentName}</p>
        <p className="mb-1">קוד ביטול התור שלכם:</p>
        <p className="text-2xl font-mono font-bold tracking-widest mb-4">{confirmed.code}</p>
        <p className="text-sm text-gray-600">
          אישור נשלח לכתובת האימייל שהזנתם. ניתן לבטל את התור בכל עת דרך עמוד{" "}
          <a href="/cancel" className="underline text-brand-blue">
            ביטול תור
          </a>
          .
        </p>
      </div>
    );
  }

  if (step === "form" && hold) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return (
      <div>
        <div className="mb-4 rounded-lg bg-brand-orange/10 border border-brand-orange px-4 py-2 text-brand-orange-dark font-medium">
          השעה {hold.time} בתאריך {formatHebrewDate(hold.date)} שמורה עבורכם למשך{" "}
          {minutes}:{seconds.toString().padStart(2, "0")} דקות. אנא השלימו את הפרטים.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="שם מלא">
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="טלפון">
            <input
              required
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="050-1234567"
            />
          </Field>
          <Field label="אימייל">
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="סיבת הפנייה">
            <textarea
              required
              className="input"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>

          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || remainingSeconds <= 0}
              className="rounded-lg bg-brand-blue px-5 py-2 text-white font-medium disabled:opacity-50"
            >
              {submitting ? "שולח..." : "אישור קביעת תור"}
            </button>
            <button
              type="button"
              onClick={() => {
                setHold(null);
                setStep("select");
                fetchSlots(date);
              }}
              className="rounded-lg border px-5 py-2 font-medium"
            >
              חזרה
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <label className="block mb-2 font-medium">בחרו תאריך</label>
      <input
        type="date"
        className="input mb-6"
        min={minDate}
        max={maxDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {date && loadingSlots && <p>טוען שעות פנויות...</p>}
      {date && slotsError && <p className="text-red-600">{slotsError}</p>}

      {date &&
        !loadingSlots &&
        !slotsError &&
        (slots.length === 0 ? (
          <p className="text-gray-600">אין שעות פנויות בתאריך זה. נסו תאריך אחר.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => handleSelectSlot(slot.time)}
                className={`rounded-lg px-3 py-2 text-sm font-medium border transition ${
                  slot.available
                    ? "border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                    : "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
