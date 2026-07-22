import { getSituationSnapshot } from "@/lib/situationData";
import { MatzavDisplay } from "./MatzavDisplay";

export const dynamic = "force-dynamic";

export default async function MatzavPage() {
  const snapshot = await getSituationSnapshot();
  return <MatzavDisplay initial={snapshot} />;
}
