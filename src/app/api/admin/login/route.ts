import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, cookieNameForDepartment, signAdminToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  let body: { departmentId?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { departmentId, password } = body;
  if (!departmentId || !password) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  if (!checkAdminPassword(departmentId, password)) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = signAdminToken(departmentId);
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieNameForDepartment(departmentId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
