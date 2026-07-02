import Link from "next/link";
import { getAllActiveDepartments } from "@/lib/departments";
import { DepartmentIcon, IconArrowStart, IconLock } from "@/lib/icons";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const departments = await getAllActiveDepartments();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
          <IconLock className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">מסך ניהול</h1>
          <p className="text-sm text-gray-500">בחרו מחלקה כדי לצפות בתורים המאושרים</p>
        </div>
      </div>

      <div className="grid gap-3">
        {departments.map((dept) => {
          return (
            <Link
              key={dept.id}
              href={`/admin/${dept.id}`}
              className="card flex items-center justify-between gap-3 p-4 transition hover:border-brand-blue/40 hover:shadow-sm"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue">
                  <DepartmentIcon id={dept.id} className="size-5" />
                </span>
                <span className="font-semibold text-gray-800">{dept.name}</span>
              </span>
              <IconArrowStart className="size-4 shrink-0 text-gray-400 rtl:rotate-180" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
