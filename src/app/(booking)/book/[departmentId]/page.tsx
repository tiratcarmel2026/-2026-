import { notFound } from "next/navigation";
import { getDepartmentById } from "@/lib/departments";
import { addDaysToDateString, MAX_ADVANCE_DAYS, todayIsraelDateString } from "@/lib/slots";
import { BookingClient } from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const department = await getDepartmentById(departmentId);

  if (!department) {
    notFound();
  }

  const minDate = todayIsraelDateString();
  const maxDate = addDaysToDateString(minDate, MAX_ADVANCE_DAYS);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-1">{department.name}</h1>
      <p className="text-gray-600 mb-6">
        {department.address} · {department.phone}
      </p>
      <BookingClient department={department} minDate={minDate} maxDate={maxDate} />
    </div>
  );
}
