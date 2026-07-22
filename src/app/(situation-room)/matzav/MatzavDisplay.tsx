"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { CityMap } from "./CityMap";
import type {
  SituationSnapshot,
  Incident,
  SituationNote,
  ResourceNeed,
  ImportantContact,
  CameraFeed,
  SituationStatus,
} from "@/lib/situationTypes";

const OREF_POLL_MS = 8000;

const SEVERITY_LABEL: Record<string, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const STATUS_LABEL: Record<string, string> = {
  active: "פעיל",
  monitoring: "במעקב",
  resolved: "טופל",
};

const NEED_STATUS_LABEL: Record<string, string> = {
  needed: "נדרש",
  in_progress: "בטיפול",
  fulfilled: "סופק",
};

export function MatzavDisplay({ initial }: { initial: SituationSnapshot }) {
  const [status, setStatus] = useState<SituationStatus>(initial.status);
  const [incidents, setIncidents] = useState<Incident[]>(initial.incidents);
  const [notes, setNotes] = useState<SituationNote[]>(initial.notes);
  const [needs, setNeeds] = useState<ResourceNeed[]>(initial.needs);
  const [contacts, setContacts] = useState<ImportantContact[]>(initial.contacts);
  const [cameras, setCameras] = useState<CameraFeed[]>(initial.cameras);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set on mount (not during render) so server and client markup match on
    // first paint - the clock only needs to exist once we're on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/oref/check", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status as SituationStatus);
        }
      } catch {
        // network hiccup - Realtime subscription and the next poll will recover
      }
    }
    poll();
    const t = setInterval(poll, OREF_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel("situation-room-display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "situation_status" },
        (payload) => {
          if (payload.new) setStatus(payload.new as SituationStatus);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        async () => {
          const { data } = await supabase
            .from("incidents")
            .select("*")
            .order("status", { ascending: true })
            .order("created_at", { ascending: false });
          if (data) setIncidents(data as Incident[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "situation_notes" },
        async () => {
          const { data } = await supabase
            .from("situation_notes")
            .select("*")
            .order("pinned", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(100);
          if (data) setNotes(data as SituationNote[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resource_needs" },
        async () => {
          const { data } = await supabase
            .from("resource_needs")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) setNeeds(data as ResourceNeed[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "important_contacts" },
        async () => {
          const { data } = await supabase
            .from("important_contacts")
            .select("*")
            .order("sort_order", { ascending: true });
          if (data) setContacts(data as ImportantContact[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "camera_feeds" },
        async () => {
          const { data } = await supabase
            .from("camera_feeds")
            .select("*")
            .eq("active", true)
            .order("sort_order", { ascending: true });
          if (data) setCameras(data as CameraFeed[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const totalInjured =
    status.injured_severe_count + status.injured_moderate_count + status.injured_light_count;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`px-6 py-4 flex items-center justify-between border-b ${
          status.alert_active
            ? "bg-matzav-critical-dim border-matzav-critical"
            : "bg-matzav-panel border-matzav-border"
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="bg-white rounded-lg p-1.5 shrink-0 hidden sm:flex items-center">
            <Image
              src="/tirat-carmel-logo-wide.png"
              alt="עיריית טירת כרמל"
              width={688}
              height={268}
              className="h-9 w-auto"
              priority
            />
          </span>
          <div>
            <h1 className="text-2xl font-bold">מצב עירוני — עיריית טירת כרמל</h1>
            {status.alert_active ? (
              <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-matzav-critical animate-pulse" />
                התרעת פיקוד העורף פעילה
                {status.alert_message ? ` — ${status.alert_message}` : ""}
              </p>
            ) : (
              <p className="text-sm text-matzav-muted mt-1">אין התרעה פעילה כרגע</p>
            )}
          </div>
        </div>
        <div className="text-left shrink-0">
          <p className="text-3xl font-mono tabular-nums">
            {now ? now.toLocaleTimeString("he-IL") : "--:--:--"}
          </p>
          <p className="text-sm text-matzav-muted">
            {now
              ? now.toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>
      </header>

      {status.headline && (
        <div className="bg-brand-orange/10 border-b border-brand-orange/40 text-brand-yellow px-6 py-2 text-sm">
          {status.headline}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-4">
        <StatCard label="הרוגים" value={status.fatalities_count} tone="critical" />
        <StatCard label="פצועים סה״כ" value={totalInjured} tone="warning" />
        <StatCard label="פצועים קשה" value={status.injured_severe_count} tone="critical" />
        <StatCard label="נעדרים" value={status.missing_count} tone="warning" />
        <StatCard label="מרחבים מוגנים פתוחים" value={status.shelters_open_count} tone="good" />
        <StatCard label="אירועים פעילים" value={activeIncidents.length} tone="warning" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 min-h-[420px]">
            <CityMap incidents={incidents} cameras={cameras} />
          </div>

          <Panel title={`אירועים (${activeIncidents.length})`}>
            {incidents.length === 0 && <EmptyRow text="אין אירועים רשומים" />}
            <div className="divide-y divide-matzav-border">
              {incidents.map((incident) => (
                <div key={incident.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{incident.title}</p>
                    {incident.address && (
                      <p className="text-sm text-matzav-muted">{incident.address}</p>
                    )}
                    {incident.description && (
                      <p className="text-sm text-slate-300 mt-1">{incident.description}</p>
                    )}
                    {(incident.injured_count > 0 || incident.fatalities_count > 0) && (
                      <p className="text-sm text-brand-yellow mt-1">
                        {incident.fatalities_count > 0 && `הרוגים: ${incident.fatalities_count} `}
                        {incident.injured_count > 0 && `פצועים: ${incident.injured_count}`}
                      </p>
                    )}
                    {incident.needs && (
                      <p className="text-sm text-brand-teal mt-1">צרכים: {incident.needs}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone={severityTone(incident.severity)}>
                      {SEVERITY_LABEL[incident.severity] ?? incident.severity}
                    </Badge>
                    <Badge tone={incident.status === "resolved" ? "good" : "warning"}>
                      {STATUS_LABEL[incident.status] ?? incident.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {cameras.length > 0 && (
            <Panel title="מצלמות שטח">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    className="rounded-lg overflow-hidden border border-matzav-border"
                  >
                    <div className="aspect-video bg-black">
                      <iframe
                        src={cam.stream_url}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        title={cam.name}
                      />
                    </div>
                    <div className="px-3 py-2 text-sm bg-matzav-panel">
                      <p className="font-medium">{cam.name}</p>
                      {cam.location && <p className="text-matzav-muted">{cam.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="יומן אירועים">
            {notes.length === 0 && <EmptyRow text="אין עדכונים" />}
            <div className="divide-y divide-matzav-border max-h-72 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="py-2">
                  <p className={note.pinned ? "font-semibold text-brand-yellow" : ""}>
                    {note.body}
                  </p>
                  <p className="text-xs text-matzav-muted-2 mt-0.5">
                    {note.author ? `${note.author} · ` : ""}
                    {new Date(note.created_at).toLocaleTimeString("he-IL")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="צרכים ומשאבים">
            {needs.length === 0 && <EmptyRow text="אין צרכים פתוחים" />}
            <div className="divide-y divide-matzav-border">
              {needs.map((need) => (
                <div key={need.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <p>{need.title}</p>
                    {need.quantity && (
                      <p className="text-xs text-matzav-muted">{need.quantity}</p>
                    )}
                  </div>
                  <Badge tone={needTone(need.status)}>{NEED_STATUS_LABEL[need.status]}</Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="מספרי טלפון חשובים">
            <div className="grid grid-cols-2 gap-2">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-lg bg-matzav-panel px-3 py-2">
                  <p className="text-sm text-matzav-muted">{c.name}</p>
                  <p className="font-mono text-lg tabular-nums">{c.phone}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="text-xs text-matzav-muted-2 flex items-center justify-between px-1">
            <span>
              פיד פיקוד העורף:{" "}
              <span
                className={
                  status.oref_feed_status === "ok"
                    ? "text-brand-lime"
                    : status.oref_feed_status === "error"
                      ? "text-matzav-critical"
                      : "text-matzav-muted"
                }
              >
                {status.oref_feed_status === "ok"
                  ? "תקין"
                  : status.oref_feed_status === "error"
                    ? "שגיאה"
                    : "לא ידוע"}
              </span>
            </span>
            {status.oref_last_checked_at && (
              <span>
                עודכן {new Date(status.oref_last_checked_at).toLocaleTimeString("he-IL")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "critical" | "warning" | "good";
}) {
  const toneClass =
    tone === "critical"
      ? "text-matzav-critical"
      : tone === "warning"
        ? "text-brand-yellow"
        : "text-brand-lime";
  return (
    <div className="rounded-xl bg-matzav-panel border border-matzav-border px-4 py-3">
      <p className="text-sm text-matzav-muted">{label}</p>
      <p className={`text-3xl font-bold tabular-nums font-mono ${toneClass}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-matzav-panel/80 border border-matzav-border px-4 py-3">
      <h2 className="font-semibold text-slate-200 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-matzav-muted-2 py-2">{text}</p>;
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "critical" | "warning" | "good";
}) {
  const toneClass =
    tone === "critical"
      ? "bg-matzav-critical/20 text-red-300"
      : tone === "warning"
        ? "bg-brand-orange/20 text-brand-yellow"
        : "bg-brand-green/20 text-brand-lime";
  return (
    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${toneClass}`}>
      {children}
    </span>
  );
}

function severityTone(severity: string): "critical" | "warning" | "good" {
  if (severity === "critical" || severity === "high") return "critical";
  if (severity === "medium") return "warning";
  return "good";
}

function needTone(status: string): "critical" | "warning" | "good" {
  if (status === "needed") return "critical";
  if (status === "in_progress") return "warning";
  return "good";
}
