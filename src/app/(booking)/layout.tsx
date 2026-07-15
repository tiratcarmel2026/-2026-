import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

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
    <html lang="he" dir="rtl">
      <body className="booking-body min-h-screen flex flex-col">
        <header className="bg-brand-blue text-white">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold">
              עיריית טירת כרמל - קביעת תורים
            </Link>
            <Link
              href="/cancel"
              className="text-sm underline decoration-brand-orange underline-offset-4"
            >
              ביטול תור
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t text-center text-sm text-gray-500 py-4">
          עיריית טירת כרמל · מוקד 106
        </footer>
      </body>
    </html>
  );
}
