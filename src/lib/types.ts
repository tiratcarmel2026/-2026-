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
