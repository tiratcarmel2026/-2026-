import { notFound } from "next/navigation";
import Link from "next/link";
import { getDepartmentById } from "@/lib/departments";
import { AdminClient } from "./AdminClient";
import { DepartmentIcon, IconArrowEnd } from "@/lib/icons";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const department = await getDepartmentById(departmentId);

  if (!department) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-blue"
      >
        <IconArrowEnd className="size-4 rtl:rotate-180" />
        חזרה לבחירת מחלקה
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
          <DepartmentIcon id={department.id} className="size-5" />
        </span>
        <h1 className="text-xl font-bold text-gray-800">ניהול תורים - {department.name}</h1>
      </div>

      <AdminClient departmentId={department.id} departmentName={department.name} />
    </div>
  );
}
