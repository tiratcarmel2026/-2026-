import { CancelClient } from "./CancelClient";
import { IconX } from "@/lib/icons";

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
          <IconX className="size-6" />
        </span>
        <h1 className="text-2xl font-bold text-gray-800">ביטול תור</h1>
        <p className="mt-1.5 text-gray-500">
          הזינו את מספר הטלפון וקוד הביטול שקיבלתם באימייל בעת קביעת התור.
        </p>
      </div>
      <div className="card p-6">
        <CancelClient />
      </div>
    </div>
  );
}
