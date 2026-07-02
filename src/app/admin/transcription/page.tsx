import { TranscriptionClient } from "./TranscriptionClient";

export const dynamic = "force-dynamic";

export default function TranscriptionAdminPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-blue mb-2">תמלול הקלטות</h1>
      <p className="text-gray-600 mb-6">
        העלאת הקלטת שיחה בעברית לתמלול אוטומטי עם חלוקה לפי דוברים - כולל
        הקלטות ארוכות של 3-4 שעות.
      </p>
      <TranscriptionClient />
    </div>
  );
}
