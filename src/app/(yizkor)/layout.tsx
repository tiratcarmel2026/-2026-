import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "יזכור - עיריית טירת כרמל",
  description:
    "עמוד הנצחה לחללי מערכות ישראל ונפגעי פעולות האיבה תושבי טירת כרמל, מטעם עיריית טירת כרמל.",
};

export default function YizkorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-yizkor-bg">{children}</body>
    </html>
  );
}
