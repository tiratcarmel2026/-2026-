import { CancelClient } from "./CancelClient";

export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-1">ביטול תור</h1>
      <p className="text-gray-600 mb-6">
        הזינו את מספר הטלפון וקוד הביטול שקיבלתם באימייל בעת קביעת התור.
      </p>
      <CancelClient />
    </div>
  );
}
