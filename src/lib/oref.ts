// Integration with the *unofficial* Home Front Command (פיקוד העורף) alert
// feed. There is no public, documented, third-party API for this - this
// polls the same endpoint that public "red alert" apps use. It can change
// or stop working without notice; every caller of fetchOrefAlert() must
// treat failures as "unknown", never as "no alert".

export const TARGET_CITY = "טירת כרמל";

const ALERTS_URL = "https://www.oref.org.il/WarningMessages/alert/alerts.json";
const FETCH_TIMEOUT_MS = 5000;

export interface RawOrefAlert {
  id?: string;
  cat?: string;
  title?: string;
  desc?: string;
  data?: string[];
}

export interface OrefPollResult {
  ok: boolean;
  /** Alert matches Tirat Carmel and is currently active. */
  matched: RawOrefAlert | null;
  error?: string;
}

/**
 * Fetches the current national alert feed and checks whether Tirat Carmel is
 * listed as an active target. Never throws - failures are reported via
 * `ok: false` so the caller can surface feed-health status instead of
 * silently treating an upstream error as "all clear".
 */
export async function fetchOrefAlert(): Promise<OrefPollResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(ALERTS_URL, {
      headers: {
        Referer: "https://www.oref.org.il/",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json,text/plain,*/*",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, matched: null, error: `HTTP_${res.status}` };
    }

    const text = (await res.text()).trim();
    if (!text) {
      // Empty body = no active alert anywhere right now.
      return { ok: true, matched: null };
    }

    let parsed: RawOrefAlert;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, matched: null, error: "INVALID_JSON" };
    }

    const areas = Array.isArray(parsed.data) ? parsed.data : [];
    const isMatch = areas.some(
      (area) => area?.trim() === TARGET_CITY || area?.includes(TARGET_CITY)
    );

    return { ok: true, matched: isMatch ? parsed : null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return { ok: false, matched: null, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
