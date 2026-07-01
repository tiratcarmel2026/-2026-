import { notFound } from "next/navigation";
import { getDepartmentById } from "@/lib/departments";
import { AdminClient } from "./AdminClient";

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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-6">
        ניהול תורים - {department.name}
      </h1>
      <AdminClient departmentId={department.id} departmentName={department.name} />
    </div>
  );
}
