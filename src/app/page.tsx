import Link from "next/link";
import { getAllActiveDepartments } from "@/lib/departments";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const departments = await getAllActiveDepartments();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-2">בחרו מחלקה לקביעת תור</h1>
      <p className="text-gray-600 mb-8">
        בחרו את המחלקה הרלוונטית לפנייתכם, ולאחר מכן בחרו תאריך ושעה פנויים.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2"
          >
            <h2 className="text-lg font-semibold text-brand-blue">{dept.name}</h2>
            <p className="text-sm text-gray-600">{dept.address}</p>
            <p className="text-sm text-gray-600">טלפון: {dept.phone}</p>
            <Link
              href={`/book/${dept.id}`}
              className="mt-3 inline-block text-center rounded-lg bg-brand-orange px-4 py-2 text-white font-medium hover:opacity-90 transition"
            >
              קביעת תור
            </Link>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <p className="text-gray-500">לא נמצאו מחלקות פעילות כרגע.</p>
      )}
    </div>
  );
}
