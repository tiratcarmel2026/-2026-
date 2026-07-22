import type { NextRequest } from "next/server";
import { cookieNameForDepartment, verifyAdminToken } from "./adminAuth";

// The situation-room console reuses the same generic per-department admin
// auth as the appointment booking system, under a fixed pseudo-department
// id. Password lives in the ADMIN_PASSWORD_SITUATION_ROOM env var.
export const SITUATION_ADMIN_ID = "situation-room";

export function isSituationAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(cookieNameForDepartment(SITUATION_ADMIN_ID))?.value;
  return verifyAdminToken(token, SITUATION_ADMIN_ID);
}
