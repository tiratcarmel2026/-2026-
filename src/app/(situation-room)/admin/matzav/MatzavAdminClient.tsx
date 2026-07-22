"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type {
  SituationSnapshot,
  Incident,
  SituationNote,
  ResourceNeed,
  ImportantContact,
  CameraFeed,
  SituationStatus,
} from "@/lib/situationTypes";

const DEPARTMENT_ID = "situation-room";

async function adminPost(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REQUEST_FAILED_${res.status}`);
  return res.json();
}

export function MatzavAdminClient() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<SituationSnapshot | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadSnapshot() {
    const res = await fetch("/api/situation", { cache: "no-store" });
    if (res.ok) setSnapshot(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSnapshot();
    const t = setInterval(loadSnapshot, 10000);
    return () => clearInterval(t);
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: DEPARTMENT_ID, password }),
      });
      if (!res.ok) {
        setLoginError("סיסמה שגויה");
        return;
      }
      setLoggedIn(true);
    } catch {
      setLoginError("אירעה שגיאת תקשורת, נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: DEPARTMENT_ID }),
    });
    setLoggedIn(false);
    setPassword("");
  }

  async function runAction(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
      await loadSnapshot();
    } catch {
      setActionError("הפעולה נכשלה (ייתכן שפג תוקף החיבור - התחברו שוב).");
      setLoggedIn(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/tirat-carmel-logo-wide.png"
            alt="עיריית טירת כרמל"
            width={688}
            height={268}
            className="h-8 w-auto hidden sm:block"
          />
          <h1 className="text-2xl font-bold text-brand-blue">קונסולת חמ״ל - מצב עירוני</h1>
        </div>
        {loggedIn ? (
          <button onClick={handleLogout} className="rounded-lg border px-4 py-2 text-sm">
            התנתקות
          </button>
        ) : (
          <form onSubmit={handleLogin} className="flex items-center gap-2">
            <input
              required
              type="password"
              placeholder="סיסמת חמ״ל"
              className="input w-40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        )}
      </div>

      {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
      {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
      {!loggedIn && (
        <p className="text-sm text-gray-500">
          ניתן לצפות במידע העדכני למטה, אך יש להתחבר כדי לערוך אותו.
        </p>
      )}

      {!snapshot ? (
        <p className="text-gray-500">טוען...</p>
      ) : (
        <>
          <StatusSection
            status={snapshot.status}
            editable={loggedIn}
            onSave={(update) => runAction(() => adminPost("/api/admin/situation/status", update))}
          />
          <IncidentsSection
            incidents={snapshot.incidents}
            editable={loggedIn}
            onCreate={(body) => runAction(() => adminPost("/api/admin/situation/incidents", body))}
            onUpdate={(id, body) =>
              runAction(() => adminPost(`/api/admin/situation/incidents/${id}`, body, "PATCH"))
            }
            onDelete={(id) =>
              runAction(() => adminPost(`/api/admin/situation/incidents/${id}`, {}, "DELETE"))
            }
          />
          <NotesSection
            notes={snapshot.notes}
            editable={loggedIn}
            onCreate={(body) => runAction(() => adminPost("/api/admin/situation/notes", body))}
            onTogglePin={(id, pinned) =>
              runAction(() => adminPost(`/api/admin/situation/notes/${id}`, { pinned }, "PATCH"))
            }
            onDelete={(id) =>
              runAction(() => adminPost(`/api/admin/situation/notes/${id}`, {}, "DELETE"))
            }
          />
          <NeedsSection
            needs={snapshot.needs}
            editable={loggedIn}
            onCreate={(body) => runAction(() => adminPost("/api/admin/situation/needs", body))}
            onUpdate={(id, body) =>
              runAction(() => adminPost(`/api/admin/situation/needs/${id}`, body, "PATCH"))
            }
            onDelete={(id) =>
              runAction(() => adminPost(`/api/admin/situation/needs/${id}`, {}, "DELETE"))
            }
          />
          <ContactsSection
            contacts={snapshot.contacts}
            editable={loggedIn}
            onCreate={(body) => runAction(() => adminPost("/api/admin/situation/contacts", body))}
            onDelete={(id) =>
              runAction(() => adminPost(`/api/admin/situation/contacts/${id}`, {}, "DELETE"))
            }
          />
          <CamerasSection
            cameras={snapshot.cameras}
            editable={loggedIn}
            onCreate={(body) => runAction(() => adminPost("/api/admin/situation/cameras", body))}
            onDelete={(id) =>
              runAction(() => adminPost(`/api/admin/situation/cameras/${id}`, {}, "DELETE"))
            }
          />
        </>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="font-semibold text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}

function StatusSection({
  status,
  editable,
  onSave,
}: {
  status: SituationStatus;
  editable: boolean;
  onSave: (update: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState(status);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(status);
  }, [status]);

  function field<K extends keyof SituationStatus>(key: K, label: string, type = "number") {
    return (
      <div>
        <label className="block text-sm mb-1">{label}</label>
        <input
          type={type}
          className="input"
          disabled={!editable}
          value={form[key] as number}
          onChange={(e) =>
            setForm({
              ...form,
              [key]: type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
        />
      </div>
    );
  }

  return (
    <Card title="סטטוס כללי">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="alert_active"
          disabled={!editable}
          checked={form.alert_active}
          onChange={(e) => setForm({ ...form, alert_active: e.target.checked })}
        />
        <label htmlFor="alert_active" className="font-medium">
          התרעה פעילה כרגע
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {field("fatalities_count", "הרוגים")}
        {field("injured_severe_count", "פצועים קשה")}
        {field("injured_moderate_count", "פצועים בינוני")}
        {field("injured_light_count", "פצועים קל")}
        {field("missing_count", "נעדרים")}
        {field("shelters_open_count", "מרחבים מוגנים פתוחים")}
      </div>
      <div className="mt-3">
        <label className="block text-sm mb-1">כותרת עליונה (headline)</label>
        <input
          className="input"
          disabled={!editable}
          value={form.headline ?? ""}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
      </div>
      <div className="mt-3">
        <label className="block text-sm mb-1">הודעת התרעה</label>
        <input
          className="input"
          disabled={!editable}
          value={form.alert_message ?? ""}
          onChange={(e) => setForm({ ...form, alert_message: e.target.value })}
        />
      </div>
      {editable && (
        <button
          className="mt-4 rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium"
          onClick={() =>
            onSave({
              alert_active: form.alert_active,
              alert_message: form.alert_message,
              fatalities_count: form.fatalities_count,
              injured_severe_count: form.injured_severe_count,
              injured_moderate_count: form.injured_moderate_count,
              injured_light_count: form.injured_light_count,
              missing_count: form.missing_count,
              shelters_open_count: form.shelters_open_count,
              headline: form.headline,
            })
          }
        >
          שמירה
        </button>
      )}
      <p className="text-xs text-gray-400 mt-3">
        פיד פיקוד העורף: {status.oref_feed_status === "ok" ? "תקין" : status.oref_feed_status === "error" ? "שגיאה" : "לא ידוע"}
        {status.oref_last_checked_at &&
          ` · נבדק לאחרונה ${new Date(status.oref_last_checked_at).toLocaleTimeString("he-IL")}`}
      </p>
    </Card>
  );
}

function IncidentsSection({
  incidents,
  editable,
  onCreate,
  onUpdate,
  onDelete,
}: {
  incidents: Incident[];
  editable: boolean;
  onCreate: (body: Record<string, unknown>) => void;
  onUpdate: (id: string, body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({
      title,
      address: address || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      description: description || null,
    });
    setTitle("");
    setAddress("");
    setLat("");
    setLng("");
    setDescription("");
  }

  return (
    <Card title={`אירועים (${incidents.length})`}>
      <div className="divide-y">
        {incidents.map((incident) => (
          <div key={incident.id} className="py-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium">{incident.title}</p>
              <p className="text-sm text-gray-500">{incident.address}</p>
              {editable && (
                <div className="flex flex-wrap gap-2 mt-2 text-sm">
                  <select
                    className="input w-auto"
                    value={incident.status}
                    onChange={(e) => onUpdate(incident.id, { status: e.target.value })}
                  >
                    <option value="active">פעיל</option>
                    <option value="monitoring">במעקב</option>
                    <option value="resolved">טופל</option>
                  </select>
                  <select
                    className="input w-auto"
                    value={incident.severity}
                    onChange={(e) => onUpdate(incident.id, { severity: e.target.value })}
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                    <option value="critical">קריטית</option>
                  </select>
                  <input
                    type="number"
                    className="input w-24"
                    placeholder="נפגעים"
                    value={incident.injured_count}
                    onChange={(e) => onUpdate(incident.id, { injured_count: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="input w-24"
                    placeholder="הרוגים"
                    value={incident.fatalities_count}
                    onChange={(e) => onUpdate(incident.id, { fatalities_count: Number(e.target.value) })}
                  />
                  <input
                    className="input flex-1 min-w-[160px]"
                    placeholder="צרכים"
                    defaultValue={incident.needs ?? ""}
                    onBlur={(e) => onUpdate(incident.id, { needs: e.target.value || null })}
                  />
                </div>
              )}
            </div>
            {editable && (
              <button onClick={() => onDelete(incident.id)} className="text-sm text-red-600">
                מחיקה
              </button>
            )}
          </div>
        ))}
        {incidents.length === 0 && <p className="text-sm text-gray-500 py-2">אין אירועים</p>}
      </div>

      {editable && (
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input required className="input" placeholder="כותרת האירוע" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" placeholder="כתובת" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="input" placeholder="קו רוחב (lat)" value={lat} onChange={(e) => setLat(e.target.value)} />
          <input className="input" placeholder="קו אורך (lng)" value={lng} onChange={(e) => setLng(e.target.value)} />
          <input className="input sm:col-span-2" placeholder="תיאור" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className="sm:col-span-2 rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium">
            הוספת אירוע
          </button>
        </form>
      )}
    </Card>
  );
}

function NotesSection({
  notes,
  editable,
  onCreate,
  onTogglePin,
  onDelete,
}: {
  notes: SituationNote[];
  editable: boolean;
  onCreate: (body: Record<string, unknown>) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ body, author: author || null });
    setBody("");
  }

  return (
    <Card title="יומן אירועים">
      <div className="divide-y max-h-64 overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="py-2 flex items-start justify-between gap-2">
            <div>
              <p className={note.pinned ? "font-semibold" : ""}>{note.body}</p>
              <p className="text-xs text-gray-400">
                {note.author ? `${note.author} · ` : ""}
                {new Date(note.created_at).toLocaleString("he-IL")}
              </p>
            </div>
            {editable && (
              <div className="flex gap-2 text-sm shrink-0">
                <button onClick={() => onTogglePin(note.id, !note.pinned)} className="text-brand-blue">
                  {note.pinned ? "בטל נעיצה" : "נעץ"}
                </button>
                <button onClick={() => onDelete(note.id)} className="text-red-600">
                  מחיקה
                </button>
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-gray-500 py-2">אין עדכונים</p>}
      </div>
      {editable && (
        <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input required className="input flex-1" placeholder="עדכון חדש" value={body} onChange={(e) => setBody(e.target.value)} />
          <input className="input sm:w-40" placeholder="שם הכותב" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <button type="submit" className="rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium">
            הוספה
          </button>
        </form>
      )}
    </Card>
  );
}

function NeedsSection({
  needs,
  editable,
  onCreate,
  onUpdate,
  onDelete,
}: {
  needs: ResourceNeed[];
  editable: boolean;
  onCreate: (body: Record<string, unknown>) => void;
  onUpdate: (id: string, body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ title, quantity: quantity || null });
    setTitle("");
    setQuantity("");
  }

  return (
    <Card title="צרכים ומשאבים">
      <div className="divide-y">
        {needs.map((need) => (
          <div key={need.id} className="py-2 flex items-center justify-between gap-2">
            <div>
              <p>{need.title}</p>
              <p className="text-xs text-gray-400">{need.quantity}</p>
            </div>
            {editable && (
              <div className="flex items-center gap-2">
                <select
                  className="input w-auto"
                  value={need.status}
                  onChange={(e) => onUpdate(need.id, { status: e.target.value })}
                >
                  <option value="needed">נדרש</option>
                  <option value="in_progress">בטיפול</option>
                  <option value="fulfilled">סופק</option>
                </select>
                <button onClick={() => onDelete(need.id)} className="text-sm text-red-600">
                  מחיקה
                </button>
              </div>
            )}
          </div>
        ))}
        {needs.length === 0 && <p className="text-sm text-gray-500 py-2">אין צרכים פתוחים</p>}
      </div>
      {editable && (
        <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input required className="input flex-1" placeholder="צורך" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input sm:w-40" placeholder="כמות" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <button type="submit" className="rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium">
            הוספה
          </button>
        </form>
      )}
    </Card>
  );
}

function ContactsSection({
  contacts,
  editable,
  onCreate,
  onDelete,
}: {
  contacts: ImportantContact[];
  editable: boolean;
  onCreate: (body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ name, phone });
    setName("");
    setPhone("");
  }

  return (
    <Card title="מספרי טלפון חשובים">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm text-gray-500">{c.name}</p>
              <p className="font-mono">{c.phone}</p>
            </div>
            {editable && (
              <button onClick={() => onDelete(c.id)} className="text-sm text-red-600">
                מחיקה
              </button>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input required className="input flex-1" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} />
          <input required className="input sm:w-40" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" className="rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium">
            הוספה
          </button>
        </form>
      )}
    </Card>
  );
}

function CamerasSection({
  cameras,
  editable,
  onCreate,
  onDelete,
}: {
  cameras: CameraFeed[];
  editable: boolean;
  onCreate: (body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [location, setLocation] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ name, stream_url: streamUrl, location: location || null });
    setName("");
    setStreamUrl("");
    setLocation("");
  }

  return (
    <Card title="מצלמות שטח (עיניים בחוץ)">
      <p className="text-sm text-gray-500 mb-3">
        אין כאן חיבור אמיתי למצלמות העירייה - יש להדביק כתובת הטמעה (iframe/HLS) של מצלמה
        קיימת אם וכאשר קיימת כזו זמינה מהמערכת העירונית.
      </p>
      <div className="divide-y">
        {cameras.map((cam) => (
          <div key={cam.id} className="py-2 flex items-center justify-between gap-2">
            <div>
              <p>{cam.name}</p>
              <p className="text-xs text-gray-400">{cam.location}</p>
            </div>
            {editable && (
              <button onClick={() => onDelete(cam.id)} className="text-sm text-red-600">
                מחיקה
              </button>
            )}
          </div>
        ))}
        {cameras.length === 0 && <p className="text-sm text-gray-500 py-2">אין מצלמות מוגדרות</p>}
      </div>
      {editable && (
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input required className="input" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="מיקום" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input required className="input" placeholder="כתובת הטמעה (URL)" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} />
          <button type="submit" className="sm:col-span-3 rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-medium">
            הוספה
          </button>
        </form>
      )}
    </Card>
  );
}
