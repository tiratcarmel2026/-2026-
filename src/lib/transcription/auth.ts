import { NextRequest } from "next/server";
import { cookieNameForDepartment, verifyAdminToken } from "@/lib/adminAuth";

// The transcription screen reuses the generic per-department admin auth
// (src/lib/adminAuth.ts) with a fixed pseudo-department id, so it gets the
// same signed-cookie session handling for free.
export const TRANSCRIPTION_ADMIN_ID = "transcription";

export function isTranscriptionRequestAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get(cookieNameForDepartment(TRANSCRIPTION_ADMIN_ID))?.value;
  return verifyAdminToken(token, TRANSCRIPTION_ADMIN_ID);
}
