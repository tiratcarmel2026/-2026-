import Link from "next/link";
import { getAllActiveDepartments } from "@/lib/departments";
import { DepartmentIcon, IconArrowStart, IconCalendar, IconClock, IconPhone } from "@/lib/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const departments = await getAllActiveDepartments();

  return (
    <div>
      <section className="bg-brand-blue-light">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <span className="badge mb-4 bg-white text-brand-blue shadow-sm">
            <IconCalendar className="size-3.5" />
            שירות מקוון 24/7
          </span>
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-brand-blue sm:text-4xl">
            קביעת תור אונליין למחלקות עיריית טירת כרמל
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            בחרו את המחלקה הרלוונטית, מצאו תאריך ושעה פנויים, ותוך דקה קבעו תור -
            בלי טלפונים ובלי המתנה בתור.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-5 text-xl font-bold text-gray-800">בחרו מחלקה לקביעת תור</h2>

        {departments.length === 0 ? (
          <p className="card p-6 text-center text-gray-500">
            לא נמצאו מחלקות פעילות כרגע.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {departments.map((dept) => {
              return (
                <Link
                  key={dept.id}
                  href={`/book/${dept.id}`}
                  className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                      <DepartmentIcon id={dept.id} className="size-5.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 group-hover:text-brand-blue">
                        {dept.name}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{dept.address}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <IconPhone className="size-3.5" />
                      {dept.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconClock className="size-3.5" />
                      {dept.work_start_time?.slice(0, 5)}-{dept.work_end_time?.slice(0, 5)}
                    </span>
                  </div>

                  <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-orange">
                    קביעת תור
                    <IconArrowStart className="size-4 rtl:rotate-180" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="card mt-8 flex flex-col items-start gap-3 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-gray-800">כבר קבעתם תור וצריכים לבטל?</p>
            <p className="text-sm text-gray-500">
              ניתן לבטל תור בכל עת עם מספר הטלפון וקוד הביטול שקיבלתם באימייל.
            </p>
          </div>
          <Link href="/cancel" className="btn-outline w-full shrink-0 sm:w-auto">
            מעבר לביטול תור
          </Link>
        </div>
      </section>
    </div>
  );
}
