"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatHebrewDate } from "@/lib/format";
import {
  IconAlertCircle,
  IconDownload,
  IconLock,
  IconLogOut,
  IconSearch,
  IconUsers,
} from "@/lib/icons";

interface AdminAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  reason: string | null;
  code: string | null;
}

interface Props {
  departmentId: string;
  departmentName: string;
}

export function AdminClient({ departmentId, departmentName }: Props) {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [search, setSearch] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId, password }),
      });
      if (!res.ok) {
        setLoginError("סיסמה שגויה");
        return;
      }
      setLoggedIn(true);
      await loadAppointments();
    } catch {
      setLoginError("אירעה שגיאת תקשורת, נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    const res = await fetch(`/api/admin/${departmentId}/appointments`);
    if (!res.ok) {
      setLoggedIn(false);
      return;
    }
    const data = await res.json();
    setAppointments(data.appointments ?? []);
  }

  function handleExportCsv() {
    const header = ["תאריך", "שעה", "שם", "טלפון", "אימייל", "סיבה", "קוד"];
    const rows = appointments.map((a) => [
      a.appointment_date,
      a.start_time.slice(0, 5),
      a.name ?? "",
      a.phone ?? "",
      a.email ?? "",
      (a.reason ?? "").replace(/\n/g, " "),
      a.code ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${departmentId}-appointments.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId }),
    });
    setLoggedIn(false);
    setAppointments([]);
    setPassword("");
  }

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return appointments;
    return appointments.filter((a) =>
      [a.name, a.phone, a.email, a.code].some((v) => v?.includes(q))
    );
  }, [appointments, search]);

  if (!loggedIn) {
    return (
      <div className="card mx-auto max-w-sm p-6">
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
          <IconLock className="size-5" />
        </span>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">סיסמת מחלקה</label>
            <input
              required
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {loginError && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-brand-red">
              <IconAlertCircle className="size-4 shrink-0" />
              {loginError}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-secondary w-full">
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-brand-blue-light px-4 py-2.5 text-brand-blue">
          <IconUsers className="size-4" />
          <span className="text-sm font-semibold">
            {appointments.length} תורים מאושרים ל{departmentName}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} className="btn-outline text-sm">
            <IconDownload className="size-4" />
            ייצוא ל-CSV
          </button>
          <button onClick={handleLogout} className="btn-outline text-sm">
            <IconLogOut className="size-4" />
            התנתקות
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <IconSearch className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input pr-10"
          placeholder="חיפוש לפי שם, טלפון, אימייל או קוד..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-500">
            <tr>
              <th className="p-3 font-semibold">תאריך</th>
              <th className="p-3 font-semibold">שעה</th>
              <th className="p-3 font-semibold">שם</th>
              <th className="p-3 font-semibold">טלפון</th>
              <th className="p-3 font-semibold">אימייל</th>
              <th className="p-3 font-semibold">סיבה</th>
              <th className="p-3 font-semibold">קוד</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                <td className="p-3 whitespace-nowrap">{formatHebrewDate(a.appointment_date)}</td>
                <td className="p-3 font-medium">{a.start_time.slice(0, 5)}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3 whitespace-nowrap">{a.phone}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3 max-w-[16rem] truncate" title={a.reason ?? ""}>
                  {a.reason}
                </td>
                <td className="p-3 font-mono text-brand-blue">{a.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-gray-500">
            {appointments.length === 0 ? "אין תורים מאושרים כרגע." : "לא נמצאו תוצאות תואמות."}
          </p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {filtered.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-gray-800">
                {formatHebrewDate(a.appointment_date)} · {a.start_time.slice(0, 5)}
              </span>
              <span className="font-mono text-xs text-brand-blue">{a.code}</span>
            </div>
            <dl className="space-y-1 text-sm text-gray-600">
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-gray-400">שם:</dt>
                <dd>{a.name}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-gray-400">טלפון:</dt>
                <dd dir="ltr" className="text-right">{a.phone}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-gray-400">אימייל:</dt>
                <dd className="truncate">{a.email}</dd>
              </div>
              {a.reason && (
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-gray-400">סיבה:</dt>
                  <dd>{a.reason}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="card p-6 text-center text-gray-500">
            {appointments.length === 0 ? "אין תורים מאושרים כרגע." : "לא נמצאו תוצאות תואמות."}
          </p>
        )}
      </div>
    </div>
  );
}
