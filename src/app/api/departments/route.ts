import { NextResponse } from "next/server";
import { getAllActiveDepartments } from "@/lib/departments";

export async function GET() {
  try {
    const departments = await getAllActiveDepartments();
    return NextResponse.json({ departments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
