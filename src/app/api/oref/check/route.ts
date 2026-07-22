import { NextResponse } from "next/server";
import { fetchOrefAlert, TARGET_CITY } from "@/lib/oref";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { SituationStatus } from "@/lib/situationTypes";

export const dynamic = "force-dynamic";

// Multiple open display/admin screens may all call this route on their own
// polling timer. To avoid hammering the upstream (unofficial) oref.org.il
// feed, the actual fetch only happens if the shared status row hasn't been
// checked in the last DEBOUNCE_MS - everyone else just gets the cached
// status back.
const DEBOUNCE_MS = 5_000;
// If no matching alert has been seen for this long after one started, treat
// it as over. Admins can also clear it manually at any time from /admin/matzav.
const AUTO_CLEAR_MS = 10 * 60 * 1000;

export async function GET() {
  const db = getSupabaseAdmin();

  const { data: statusRow, error: statusError } = await db
    .from("situation_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (statusError || !statusRow) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  const status = statusRow as SituationStatus;
  const now = Date.now();
  const lastChecked = status.oref_last_checked_at
    ? new Date(status.oref_last_checked_at).getTime()
    : 0;

  if (now - lastChecked < DEBOUNCE_MS) {
    return NextResponse.json({ status });
  }

  const result = await fetchOrefAlert();
  const nowIso = new Date(now).toISOString();

  const update: Partial<SituationStatus> = {
    oref_last_checked_at: nowIso,
  };

  if (!result.ok) {
    update.oref_feed_status = "error";
  } else {
    update.oref_feed_status = "ok";
    update.oref_last_success_at = nowIso;

    if (result.matched) {
      const matched = result.matched;

      // Dedupe: skip logging if we already have a very recent row for the
      // same alert (matters when `id` is missing from the upstream payload).
      const { data: recent } = await db
        .from("oref_alerts")
        .select("id, external_id, title")
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isDuplicate =
        recent &&
        ((matched.id && recent.external_id === matched.id) ||
          (!matched.id &&
            recent.title === (matched.title ?? null) &&
            now - lastChecked < 60_000));

      if (!isDuplicate) {
        await db.from("oref_alerts").insert({
          external_id: matched.id ?? null,
          category: matched.cat ?? null,
          title: matched.title ?? null,
          description: matched.desc ?? null,
          matched_area: TARGET_CITY,
          raw: matched,
        });
      }

      update.alert_active = true;
      update.alert_message = matched.desc || matched.title || update.alert_message;
      if (!status.alert_active) {
        update.alert_started_at = nowIso;
      }
    } else if (status.alert_active && status.alert_started_at) {
      const startedAt = new Date(status.alert_started_at).getTime();
      if (now - startedAt > AUTO_CLEAR_MS) {
        update.alert_active = false;
        await db.from("situation_notes").insert({
          body: "ההתרעה סומנה כהסתיימה אוטומטית (לא התקבלה התרעה נוספת מפיקוד העורף לאזור טירת כרמל).",
          author: "מערכת",
        });
      }
    }
  }

  const { data: updated, error: updateError } = await db
    .from("situation_status")
    .update(update)
    .eq("id", 1)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ status: { ...status, ...update } });
  }

  return NextResponse.json({ status: updated as SituationStatus });
}
