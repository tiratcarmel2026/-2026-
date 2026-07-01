import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable");
  }
  return secret;
}

export function adminPasswordEnvVarName(departmentId: string): string {
  return `ADMIN_PASSWORD_${departmentId.toUpperCase().replace(/-/g, "_")}`;
}

export function checkAdminPassword(departmentId: string, password: string): boolean {
  const expected = process.env[adminPasswordEnvVarName(departmentId)];
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function cookieNameForDepartment(departmentId: string): string {
  return `tc_admin_${departmentId}`;
}

/** Signed, stateless session token: base64url(payload) + "." + base64url(hmac) */
export function signAdminToken(departmentId: string): string {
  const payload = JSON.stringify({
    deptId: departmentId,
    exp: Date.now() + SESSION_DURATION_MS,
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${sig.toString("base64url")}`;
}

export function verifyAdminToken(
  token: string | undefined,
  departmentId: string
): boolean {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  let actualSig: Buffer;
  try {
    actualSig = Buffer.from(sigB64, "base64url");
  } catch {
    return false;
  }
  if (expectedSig.length !== actualSig.length) return false;
  if (!timingSafeEqual(expectedSig, actualSig)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.deptId !== departmentId) return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
