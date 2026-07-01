import { NextRequest, NextResponse } from "next/server";
import { cookieNameForDepartment } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  let body: { departmentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (!body.departmentId) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(cookieNameForDepartment(body.departmentId));
  return response;
}
