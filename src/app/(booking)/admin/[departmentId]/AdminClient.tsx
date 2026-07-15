"use client";

import { useState, type FormEvent } from "react";
import { formatHebrewDate } from "@/lib/format";

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

  if (!loggedIn) {
    return (
      <form onSubmit={handleLogin} className="max-w-sm space-y-4">
        <div>
          <label className="block mb-1 font-medium">סיסמת מחלקה</label>
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
          disabled={loading}
          className="rounded-lg bg-brand-blue px-5 py-2 text-white font-medium disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">
          {appointments.length} תורים מאושרים ל{departmentName}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            ייצוא ל-CSV
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            התנתקות
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">תאריך</th>
              <th className="p-3">שעה</th>
              <th className="p-3">שם</th>
              <th className="p-3">טלפון</th>
              <th className="p-3">אימייל</th>
              <th className="p-3">סיבה</th>
              <th className="p-3">קוד</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{formatHebrewDate(a.appointment_date)}</td>
                <td className="p-3">{a.start_time.slice(0, 5)}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.phone}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.reason}</td>
                <td className="p-3 font-mono">{a.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p className="p-4 text-center text-gray-500">אין תורים מאושרים כרגע.</p>
        )}
      </div>
    </div>
  );
}
