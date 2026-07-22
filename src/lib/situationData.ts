import { getSupabaseAdmin } from "./supabaseAdmin";
import type { SituationSnapshot } from "./situationTypes";

export async function getSituationSnapshot(): Promise<SituationSnapshot> {
  const db = getSupabaseAdmin();

  const [status, incidents, notes, needs, contacts, cameras, recentAlerts] =
    await Promise.all([
      db.from("situation_status").select("*").eq("id", 1).single(),
      db
        .from("incidents")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false }),
      db
        .from("situation_notes")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("resource_needs").select("*").order("created_at", { ascending: false }),
      db.from("important_contacts").select("*").order("sort_order", { ascending: true }),
      db
        .from("camera_feeds")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      db
        .from("oref_alerts")
        .select("id, external_id, category, title, description, matched_area, received_at")
        .order("received_at", { ascending: false })
        .limit(20),
    ]);

  if (status.error) throw new Error(status.error.message);

  return {
    status: status.data,
    incidents: incidents.data ?? [],
    notes: notes.data ?? [],
    needs: needs.data ?? [],
    contacts: contacts.data ?? [],
    cameras: cameras.data ?? [],
    recentAlerts: recentAlerts.data ?? [],
  } as SituationSnapshot;
}
