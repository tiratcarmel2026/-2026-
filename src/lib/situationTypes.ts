export interface SituationStatus {
  id: 1;
  alert_active: boolean;
  alert_started_at: string | null;
  alert_message: string | null;
  fatalities_count: number;
  injured_severe_count: number;
  injured_moderate_count: number;
  injured_light_count: number;
  missing_count: number;
  shelters_open_count: number;
  headline: string | null;
  oref_feed_status: "unknown" | "ok" | "error";
  oref_last_checked_at: string | null;
  oref_last_success_at: string | null;
  updated_at: string;
  updated_by: string | null;
}

export type IncidentStatus = "active" | "monitoring" | "resolved";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  lat: number | null;
  lng: number | null;
  address: string | null;
  fatalities_count: number;
  injured_count: number;
  needs: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SituationNote {
  id: string;
  body: string;
  author: string | null;
  pinned: boolean;
  created_at: string;
}

export type ResourceNeedStatus = "needed" | "in_progress" | "fulfilled";

export interface ResourceNeed {
  id: string;
  title: string;
  quantity: string | null;
  status: ResourceNeedStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportantContact {
  id: string;
  name: string;
  phone: string;
  category: string;
  sort_order: number;
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string | null;
  stream_url: string;
  lat: number | null;
  lng: number | null;
  active: boolean;
  sort_order: number;
}

export interface OrefAlert {
  id: string;
  external_id: string | null;
  category: string | null;
  title: string | null;
  description: string | null;
  matched_area: string | null;
  received_at: string;
}

export interface SituationSnapshot {
  status: SituationStatus;
  incidents: Incident[];
  notes: SituationNote[];
  needs: ResourceNeed[];
  contacts: ImportantContact[];
  cameras: CameraFeed[];
  recentAlerts: OrefAlert[];
}
