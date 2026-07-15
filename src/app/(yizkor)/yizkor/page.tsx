import Image from "next/image";
import Link from "next/link";

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function MonumentIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="text-white/25"
      aria-hidden="true"
    >
      <path d="M12 2c1.5 2 2.5 4.2 2.5 6.5S13.5 13 12 13s-2.5-2.2-2.5-4.5S10.5 4 12 2z" />
      <path d="M8 22l1.5-9h5L16 22" />
      <path d="M5 22h14" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="text-white/25"
      aria-hidden="true"
    >
      <path d="M12 2l4 6h-2.5l3.5 5.5h-3L17 19H7l2.5-5.5h-3L10 8H7.5L12 2z" />
      <path d="M12 19v3" />
    </svg>
  );
}

function CandleIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-white/70"
      aria-hidden="true"
    >
      <path d="M12 2c1.2 1.6 2 2.9 2 4a2 2 0 1 1-4 0c0-1.1.8-2.4 2-4z" />
      <rect x="9.5" y="8" width="5" height="13" rx="1" />
    </svg>
  );
}

function CityIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-white/70"
      aria-hidden="true"
    >
      <rect x="3" y="10" width="4" height="11" />
      <rect x="10" y="5" width="4" height="16" />
      <rect x="17" y="13" width="4" height="8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-white"
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M3 6.5l9 6.5 9-6.5" />
    </svg>
  );
}

export default function YizkorHomePage() {
  return (
    <div className="min-h-screen flex flex-col text-white">
      <div className="max-w-3xl mx-auto w-full px-4 py-10 flex flex-col items-center text-center gap-6">
        <div className="bg-white rounded-2xl px-6 py-3 shadow-lg">
          <Image
            src="/tirat-carmel-logo.jpeg"
            alt="עיריית טירת כרמל - סביבה טובה בין כרמל לים"
            width={960}
            height={960}
            className="h-auto w-40 sm:w-48"
            priority
          />
        </div>

        <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight">
          יזכור
        </h1>

        <p className="text-lg sm:text-xl text-white/90 max-w-xl leading-relaxed">
          עמוד הנצחה לחללי מערכות ישראל ונפגעי פעולות האיבה תושבי טירת כרמל
        </p>

        <blockquote className="text-yizkor-gold">
          <p className="text-xl sm:text-2xl font-semibold">
            &bdquo;עַל אֵלֶּה אֲנִי בוֹכִיָּה, עֵינִי עֵינִי יֹרְדָה מַיִם&rdquo;
          </p>
          <cite className="block not-italic text-sm sm:text-base mt-2 text-yizkor-gold/80">
            איכה א&apos;, ט&quot;ז
          </cite>
        </blockquote>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-5">
        <section className="relative overflow-hidden rounded-2xl border border-yizkor-border bg-gradient-to-br from-[#1a2f52] via-[#10254a] to-[#050d1e] h-64 sm:h-72 flex items-end p-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <MonumentIcon />
          </div>
          <div className="relative z-10 text-right w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              אנדרטת
              <br />
              הזיכרון
            </h2>
            <span className="inline-block mt-2 text-white/80">
              <Chevron />
            </span>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-yizkor-border bg-gradient-to-br from-[#1e3d2a] via-[#15301f] to-[#0a1c11] h-64 sm:h-72 flex items-end p-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <TreeIcon />
          </div>
          <div className="relative z-10 text-right w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              יער
              <br />
              הנופלים
            </h2>
            <span className="inline-block mt-2 text-white/80">
              <Chevron />
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
          <a
            href="https://www.izkor.gov.il"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-yizkor-border bg-gradient-to-br from-[#2a2013] via-[#1a140c] to-[#0a0805] p-5 flex flex-col justify-between min-h-40 hover:opacity-90 transition"
          >
            <CandleIcon />
            <div>
              <p className="font-bold leading-snug">
                פתיחת עמוד יזכור
                <br />
                הרשמי
              </p>
              <span className="inline-block mt-2 text-white/80">
                <Chevron />
              </span>
            </div>
          </a>

          <Link
            href="/yizkor/fallen"
            className="rounded-2xl border border-yizkor-border bg-gradient-to-br from-[#16273f] via-[#101d33] to-[#050b18] p-5 flex flex-col justify-between min-h-40 hover:opacity-90 transition"
          >
            <CityIcon />
            <div>
              <p className="font-bold leading-snug">
                צפייה בחללים המונצחים
                <br />
                תושבי העיר
              </p>
              <span className="inline-block mt-2 text-white/80">
                <Chevron />
              </span>
            </div>
          </Link>

          <Link
            href="/yizkor/contact"
            className="rounded-2xl border border-yizkor-border bg-yizkor-card p-5 flex flex-col items-center justify-center gap-3 min-h-40 hover:opacity-90 transition text-center"
          >
            <MailIcon />
            <div>
              <p className="font-bold">צור קשר</p>
              <span className="inline-block mt-2 text-white/80">
                <Chevron />
              </span>
            </div>
          </Link>
        </div>
      </div>

      <footer className="text-center text-white/50 text-xs sm:text-sm py-6 border-t border-white/10">
        כל הזכויות שמורות לעיריית טירת כרמל · טירת כרמל {new Date().getFullYear()}
      </footer>
    </div>
  );
}
