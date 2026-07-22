import { NextResponse } from "next/server";
import { getSituationSnapshot } from "@/lib/situationData";

export const dynamic = "force-dynamic";

// Public read-only snapshot, used for the initial page load of /matzav
// before the client-side Realtime subscription takes over. No auth - this
// is meant to be shown on a screen anyone in the building can see.
export async function GET() {
  try {
    const snapshot = await getSituationSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
