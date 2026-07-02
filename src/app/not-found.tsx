import Link from "next/link";
import { IconAlertCircle } from "@/lib/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
        <IconAlertCircle className="size-7" />
      </span>
      <h1 className="text-xl font-bold text-gray-800">הדף המבוקש לא נמצא</h1>
      <p className="mt-2 text-gray-500">
        ייתכן שהקישור שגוי, או שהמחלקה המבוקשת אינה זמינה יותר.
      </p>
      <Link href="/" className="btn-secondary mt-6 inline-flex">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
