import type { Metadata } from "next";
import Link from "next/link";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { IconCalendar, IconMapPin, IconPhone } from "@/lib/icons";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "קביעת תורים - עיריית טירת כרמל",
  description: "מערכת קביעת תורים מקוונת למחלקות עיריית טירת כרמל",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main-content" className="skip-link">
          דלגו לתוכן הראשי
        </a>

        <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-blue text-white shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 font-extrabold">
                טכ
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold">עיריית טירת כרמל</span>
                <span className="text-xs text-white/75">קביעת תורים מקוונת</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1.5 text-sm font-medium">
              <Link
                href="/"
                className="hidden rounded-lg px-3 py-2 hover:bg-white/10 sm:block"
              >
                בחירת מחלקה
              </Link>
              <Link
                href="/cancel"
                className="rounded-lg border border-white/25 px-3 py-2 hover:bg-white/10"
              >
                ביטול תור
              </Link>
            </nav>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          <ToastProvider>{children}</ToastProvider>
        </main>

        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-gray-600 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-bold text-gray-800">עיריית טירת כרמל</p>
              <p className="flex items-center gap-2">
                <IconMapPin className="size-4 shrink-0 text-brand-blue" />
                רחוב העצמאות 1, טירת כרמל
              </p>
            </div>
            <div>
              <p className="mb-2 font-bold text-gray-800">יצירת קשר</p>
              <a
                href="tel:106"
                className="flex items-center gap-2 hover:text-brand-blue"
              >
                <IconPhone className="size-4 shrink-0 text-brand-blue" />
                מוקד עירוני 106
              </a>
            </div>
            <div>
              <p className="mb-2 font-bold text-gray-800">שירות מקוון</p>
              <Link href="/" className="flex items-center gap-2 hover:text-brand-blue">
                <IconCalendar className="size-4 shrink-0 text-brand-blue" />
                קביעת תור לכל המחלקות
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
            עיריית טירת כרמל · האתר נגיש לאנשים עם מוגבלות · כל הזכויות שמורות
          </div>
        </footer>
      </body>
    </html>
  );
}
