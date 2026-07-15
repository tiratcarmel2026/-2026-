import { Resend } from "resend";
import type { Appointment, Department } from "./types";
import { formatHebrewDate } from "./format";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

/** Sends confirmation emails to the resident and to the department.
 * Never throws - a failed email must not block a successful booking. */
export async function sendBookingConfirmationEmails(
  department: Department,
  appointment: Appointment
): Promise<void> {
  const client = getResend();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!client || !from) {
    console.warn(
      "[email] RESEND_API_KEY / RESEND_FROM_EMAIL not configured - skipping confirmation emails"
    );
    return;
  }

  const dateLabel = formatHebrewDate(appointment.appointment_date);
  const timeLabel = appointment.start_time.slice(0, 5);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    if (appointment.email) {
      await client.emails.send({
        from,
        to: appointment.email,
        subject: `אישור תור - ${department.name} - עיריית טירת כרמל`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>התור שלך אושר</h2>
            <p>שלום ${escapeHtml(appointment.name ?? "")},</p>
            <p>התור שלך למחלקת <strong>${escapeHtml(department.name)}</strong> נקבע בהצלחה:</p>
            <ul>
              <li><strong>תאריך:</strong> ${dateLabel}</li>
              <li><strong>שעה:</strong> ${timeLabel}</li>
              <li><strong>כתובת:</strong> ${escapeHtml(department.address)}</li>
            </ul>
            <p>קוד ביטול התור שלך: <strong style="font-size: 1.2em;">${appointment.code}</strong></p>
            <p>לביטול התור, היכנס/י ל-${appUrl}/cancel והזן/י את מספר הטלפון וקוד הביטול.</p>
            <p>לשאלות ניתן לפנות למחלקה בטלפון ${escapeHtml(department.phone)}.</p>
          </div>
        `,
      });
    }

    await client.emails.send({
      from,
      to: department.email,
      subject: `תור חדש נקבע - ${dateLabel} ${timeLabel}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>נקבע תור חדש</h2>
          <ul>
            <li><strong>תאריך:</strong> ${dateLabel}</li>
            <li><strong>שעה:</strong> ${timeLabel}</li>
            <li><strong>שם:</strong> ${escapeHtml(appointment.name ?? "")}</li>
            <li><strong>טלפון:</strong> ${escapeHtml(appointment.phone ?? "")}</li>
            <li><strong>אימייל:</strong> ${escapeHtml(appointment.email ?? "")}</li>
            <li><strong>סיבת הפנייה:</strong> ${escapeHtml(appointment.reason ?? "-")}</li>
          </ul>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] Failed to send confirmation emails", err);
  }
}

const YIZKOR_CONTACT_EMAIL = "elada@tirat-carmel.muni.il";

export type YizkorContactMessage = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

/** Sends a Yizkor page contact-form submission to the municipality contact.
 * Never throws - the caller decides how to report failure to the user. */
export async function sendYizkorContactEmail(
  data: YizkorContactMessage
): Promise<void> {
  const client = getResend();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!client || !from) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  await client.emails.send({
    from,
    to: YIZKOR_CONTACT_EMAIL,
    replyTo: data.email,
    subject: `פנייה חדשה דרך עמוד יזכור - ${data.name}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>פנייה חדשה מעמוד יזכור</h2>
        <ul>
          <li><strong>שם:</strong> ${escapeHtml(data.name)}</li>
          <li><strong>דוא&quot;ל:</strong> ${escapeHtml(data.email)}</li>
          <li><strong>טלפון:</strong> ${escapeHtml(data.phone ?? "-")}</li>
        </ul>
        <p><strong>תוכן הפנייה:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
