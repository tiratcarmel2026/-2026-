export interface Department {
  id: string;
  name: string;
  address: string;
  phone: string;
  contact_name: string | null;
  email: string;
  slot_duration_minutes: number;
  work_days: number[];
  work_start_time: string; // "HH:MM:SS"
  work_end_time: string; // "HH:MM:SS"
  active: boolean;
}

export type AppointmentStatus = "held" | "confirmed" | "cancelled";

export interface Appointment {
  id: string;
  department_id: string;
  appointment_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  status: AppointmentStatus;
  holder_id: string;
  expires_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  reason: string | null;
  code: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface SlotInfo {
  time: string; // "HH:MM"
  available: boolean;
}

export type TranscriptionJobStatus =
  | "pending_upload"
  | "pending"
  | "processing"
  | "done"
  | "failed";

export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  speaker: string; // e.g. "SPEAKER_00"
  text: string;
}

export interface Transcript {
  segments: TranscriptSegment[];
  speakers: string[];
}

export interface TranscriptionJob {
  id: string;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  status: TranscriptionJobStatus;
  progress_stage: string | null;
  progress_percent: number;
  error_message: string | null;
  duration_seconds: number | null;
  transcript: Transcript | null;
  speaker_names: Record<string, string>;
  created_at: string;
  updated_at: string;
}
