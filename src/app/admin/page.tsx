import Link from "next/link";
import { getAllActiveDepartments } from "@/lib/departments";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const departments = await getAllActiveDepartments();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-6">מסך ניהול - בחרו מחלקה</h1>
      <div className="grid gap-3">
        {departments.map((dept) => (
          <Link
            key={dept.id}
            href={`/admin/${dept.id}`}
            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-blue transition"
          >
            {dept.name}
          </Link>
        ))}
        <Link
          href="/admin/transcription"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-blue transition"
        >
          תמלול הקלטות
        </Link>
      </div>
    </div>
  );
}
