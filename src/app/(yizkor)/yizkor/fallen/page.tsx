import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "חללים מונצחים תושבי העיר - יזכור טירת כרמל",
};

const monuments = [
  {
    title: "עמוד יזכור - חלל א׳",
    url: "https://www.izkor.gov.il/monument/en_fcf85b2f730ef7ce258fa91277f0dff3",
  },
  {
    title: "עמוד יזכור - חלל ב׳",
    url: "https://www.izkor.gov.il/monument/en_b2888e1e911721c708ffbde4d71a52b6",
  },
];

export default function FallenPage() {
  return (
    <div className="min-h-screen text-white flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-4">
        <Link
          href="/yizkor"
          className="self-start text-sm text-white/70 hover:text-white transition"
        >
          &rarr; חזרה לעמוד יזכור
        </Link>
        <h1 className="text-3xl font-extrabold">
          צפייה בחללים המונצחים תושבי העיר
        </h1>
        <p className="text-white/80">
          עמודי ההנצחה הרשמיים מתוך אתר יזכור של משרד הביטחון. אם התוכן אינו
          נטען כאן, ניתן ללחוץ על &quot;צפייה בעמוד המקורי&quot; לפתיחתו בכרטיסייה
          נפרדת.
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 pb-10 flex flex-col gap-8">
        {monuments.map((m) => (
          <div
            key={m.url}
            className="rounded-2xl border border-yizkor-border bg-yizkor-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-yizkor-border">
              <span className="font-semibold">{m.title}</span>
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-yizkor-gold underline underline-offset-4"
              >
                צפייה בעמוד המקורי
              </a>
            </div>
            <iframe
              src={m.url}
              title={m.title}
              loading="lazy"
              className="w-full h-[70vh] bg-white"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ))}
      </div>

      <footer className="text-center text-white/50 text-xs sm:text-sm py-6 border-t border-white/10">
        כל הזכויות שמורות לעיריית טירת כרמל · טירת כרמל {new Date().getFullYear()}
      </footer>
    </div>
  );
}
