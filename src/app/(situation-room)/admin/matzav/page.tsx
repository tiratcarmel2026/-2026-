import { MatzavAdminClient } from "./MatzavAdminClient";

export const dynamic = "force-dynamic";

export default function MatzavAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <MatzavAdminClient />
    </div>
  );
}
