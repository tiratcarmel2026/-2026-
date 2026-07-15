import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "צור קשר - יזכור טירת כרמל",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen text-white flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-4">
        <Link
          href="/yizkor"
          className="self-start text-sm text-white/70 hover:text-white transition"
        >
          &rarr; חזרה לעמוד יזכור
        </Link>
        <h1 className="text-3xl font-extrabold">צור קשר</h1>
        <p className="text-white/80">
          לשאלות, בקשות להוספת שם או עדכון פרטים בעמוד ההנצחה - מלאו את הטופס
          ופנייתכם תישלח ישירות לגורם המטפל בעירייה.
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 pb-10">
        <ContactForm />
      </div>

      <footer className="text-center text-white/50 text-xs sm:text-sm py-6 border-t border-white/10 mt-auto">
        כל הזכויות שמורות לעיריית טירת כרמל · טירת כרמל {new Date().getFullYear()}
      </footer>
    </div>
  );
}
