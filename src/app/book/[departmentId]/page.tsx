import { notFound } from "next/navigation";
import Link from "next/link";
import { getDepartmentById } from "@/lib/departments";
import { addDaysToDateString, MAX_ADVANCE_DAYS, todayIsraelDateString } from "@/lib/slots";
import { BookingClient } from "./BookingClient";
import { DepartmentIcon, IconArrowEnd, IconClock, IconMapPin, IconPhone } from "@/lib/icons";

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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-blue"
      >
        <IconArrowEnd className="size-4 rtl:rotate-180" />
        חזרה לבחירת מחלקה
      </Link>

      <div className="card mb-6 flex items-start gap-3.5 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
          <DepartmentIcon id={department.id} className="size-5.5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-800">{department.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <IconMapPin className="size-3.5" />
              {department.address}
            </span>
            <span className="flex items-center gap-1.5">
              <IconPhone className="size-3.5" />
              {department.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <IconClock className="size-3.5" />
              {department.work_start_time?.slice(0, 5)}-{department.work_end_time?.slice(0, 5)}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-7">
        <BookingClient department={department} minDate={minDate} maxDate={maxDate} />
      </div>
    </div>
  );
}
