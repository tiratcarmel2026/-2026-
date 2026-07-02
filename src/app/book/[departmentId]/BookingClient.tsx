"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Department, SlotInfo } from "@/lib/types";
import { formatHebrewDate } from "@/lib/format";
import { Stepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { IconAlertCircle, IconCheckCircle, IconClock } from "@/lib/icons";

type Step = "select" | "form" | "confirmed";

const STEP_LABELS = ["תאריך ושעה", "פרטים אישיים", "אישור"];

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

function addDaysToIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("he-IL", { timeZone: "UTC", weekday: "short" }).format(date);
}

export function BookingClient({ department, minDate, maxDate }: Props) {
  const { showToast } = useToast();
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

  const quickDates = useMemo(() => {
    const out: string[] = [];
    let d = minDate;
    let guard = 0;
    while (out.length < 7 && guard < 21 && d <= maxDate) {
      out.push(d);
      d = addDaysToIsoDate(d, 1);
      guard++;
    }
    return out;
  }, [minDate, maxDate]);

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
          showToast("התור הזה נתפס הרגע לפני שהספקתם, אנא בחרו שעה אחרת.", "error");
        } else {
          showToast("אירעה שגיאה, נסו שוב.", "error");
        }
        fetchSlots(date);
        return;
      }
      setHold({ holderId: data.holderId, expiresAt: data.expiresAt, date, time });
      setStep("form");
    } catch {
      showToast("אירעה שגיאת תקשורת, נסו שוב.", "error");
    }
  }

  function handleHoldExpired() {
    showToast("הזמן להשלמת ההזמנה הסתיים. אנא בחרו שעה מחדש.", "error");
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

  const stepIndex = step === "select" ? 0 : step === "form" ? 1 : 2;

  if (step === "confirmed" && confirmed) {
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
        <div className="text-center">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
            <IconCheckCircle className="size-9" />
          </span>
          <h2 className="mb-1 text-xl font-bold text-gray-800">התור נקבע בהצלחה!</h2>
          <p className="text-gray-600">{confirmed.departmentName}</p>

          <div className="card mx-auto mt-5 max-w-sm bg-brand-blue-light p-5 text-right">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">תאריך</dt>
                <dd className="font-semibold text-gray-800">{formatHebrewDate(confirmed.date)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">שעה</dt>
                <dd className="font-semibold text-gray-800">{confirmed.time}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-brand-blue/15 pt-4">
              <p className="mb-1 text-sm text-gray-500">קוד ביטול התור שלכם</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-brand-blue">
                {confirmed.code}
              </p>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-sm text-sm text-gray-500">
            אישור נשלח לכתובת האימייל שהזנתם. ניתן לבטל את התור בכל עת דרך עמוד{" "}
            <a href="/cancel" className="font-medium text-brand-blue underline underline-offset-2">
              ביטול תור
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (step === "form" && hold) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const urgent = remainingSeconds <= 60;
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />

        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            urgent
              ? "border-brand-red/30 bg-red-50 text-brand-red"
              : "border-brand-orange/30 bg-brand-orange/10 text-brand-orange-dark"
          }`}
        >
          <span>
            השעה <b>{hold.time}</b> בתאריך <b>{formatHebrewDate(hold.date)}</b> שמורה עבורכם
          </span>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-base font-bold">
            <IconClock className="size-4" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="שם מלא">
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
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
                autoComplete="tel"
              />
            </Field>
          </div>
          <Field label="אימייל">
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
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

          {formError && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-brand-red">
              <IconAlertCircle className="size-4 shrink-0" />
              {formError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || remainingSeconds <= 0}
              className="btn-primary flex-1 sm:flex-none"
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
              className="btn-outline"
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
      <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />

      <label className="label">בחרו תאריך</label>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {quickDates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDate(d)}
            className={`flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
              date === d
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-gray-200 text-gray-600 hover:border-brand-blue/40"
            }`}
          >
            <span className="text-xs opacity-80">{weekdayShort(d)}</span>
            <span className="font-bold">{d.slice(8, 10)}/{d.slice(5, 7)}</span>
          </button>
        ))}
      </div>
      <input
        type="date"
        className="input mb-6"
        min={minDate}
        max={maxDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="בחירת תאריך מדויק"
      />

      {date && (
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <IconClock className="size-4 text-brand-blue" />
          שעות פנויות ל{formatHebrewDate(date)}
        </div>
      )}

      {date && loadingSlots && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}
      {date && slotsError && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-brand-red">
          <IconAlertCircle className="size-4" />
          {slotsError}
        </p>
      )}

      {date &&
        !loadingSlots &&
        !slotsError &&
        (slots.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            אין שעות פנויות בתאריך זה. נסו תאריך אחר.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => handleSelectSlot(slot.time)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  slot.available
                    ? "border-brand-blue/30 text-brand-blue hover:border-brand-blue hover:bg-brand-blue hover:text-white"
                    : "cursor-not-allowed border-gray-100 text-gray-300 line-through"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ))}

      {!date && (
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
          בחרו תאריך כדי לראות שעות פנויות.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
