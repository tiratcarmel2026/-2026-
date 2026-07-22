import type { Metadata } from "next";
import "../globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "מצב עירוני - עיריית טירת כרמל",
  description: "מסך מצב עירוני בזמן חירום - עיריית טירת כרמל",
};

export default function SituationRoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-matzav-bg text-slate-100">{children}</body>
    </html>
  );
}
