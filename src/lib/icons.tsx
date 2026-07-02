import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconBriefcase = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>,
    p
  );

export const IconRuler = (p: IconProps) =>
  base(
    <>
      <path d="m3 16 13-13 5 5-13 13-5-5Z" />
      <path d="m14 6 2 2" />
      <path d="m11 9 2 2" />
      <path d="m8 12 2 2" />
      <path d="m5 15 2 2" />
    </>,
    p
  );

export const IconCoins = (p: IconProps) =>
  base(
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3.5" />
      <path d="M3 7v5c0 1.93 2.69 3.5 6 3.5s6-1.57 6-3.5V7" />
      <path d="M13.5 10.6c3.1.3 5.5 1.75 5.5 3.4 0 1.93-2.69 3.5-6 3.5-2.6 0-4.82-.96-5.66-2.3" />
    </>,
    p
  );

export const IconHeartHands = (p: IconProps) =>
  base(
    <>
      <path d="M12 20s-6.5-4.1-9-8.2C1.1 8.7 2.5 5.5 5.6 5c1.8-.3 3.4.6 4.4 2 1-1.4 2.6-2.3 4.4-2 3.1.5 4.5 3.7 2.6 6.8-2.5 4.1-9 8.2-9 8.2Z" />
    </>,
    p
  );

export const IconGraduationCap = (p: IconProps) =>
  base(
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" />
      <path d="M6 12v4.5c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5V12" />
      <path d="M21 10v6" />
    </>,
    p
  );

export const IconLeaf = (p: IconProps) =>
  base(
    <>
      <path d="M4 20c8 0 14-4.5 16-16-11.5 0-16 6-16 16Z" />
      <path d="M5 19c3-4 6-7 12-11" />
    </>,
    p
  );

export const IconMapPin = (p: IconProps) =>
  base(
    <>
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </>,
    p
  );

export const IconPhone = (p: IconProps) =>
  base(
    <path d="M4.5 3.5h3.2l1.5 4.3-2 1.7a12.4 12.4 0 0 0 6.3 6.3l1.7-2 4.3 1.5v3.2c0 1-.9 1.8-1.9 1.6C10.9 19 5 13.1 3.4 6.4a1.7 1.7 0 0 1 1.1-2.9Z" />,
    p
  );

export const IconClock = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>,
    p
  );

export const IconCalendar = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>,
    p
  );

export const IconCheckCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.1" />
    </>,
    p
  );

export const IconAlertCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.2v.1" />
    </>,
    p
  );

export const IconX = (p: IconProps) =>
  base(
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>,
    p
  );

export const IconArrowStart = (p: IconProps) =>
  base(
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>,
    p
  );

export const IconArrowEnd = (p: IconProps) =>
  base(
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>,
    p
  );

export const IconLock = (p: IconProps) =>
  base(
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>,
    p
  );

export const IconDownload = (p: IconProps) =>
  base(
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4.5 19.5h15" />
    </>,
    p
  );

export const IconSearch = (p: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
    p
  );

export const IconUsers = (p: IconProps) =>
  base(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.7-3 2.9-4.8 5.5-4.8s4.8 1.8 5.5 4.8" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M15.8 14.4c2.2.4 3.7 2 4.2 4.3" />
    </>,
    p
  );

export const IconLogOut = (p: IconProps) =>
  base(
    <>
      <path d="M14 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h7" />
      <path d="M20 12H10" />
      <path d="m16 8 4 4-4 4" />
    </>,
    p
  );

export function DepartmentIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "business-licensing":
      return <IconBriefcase className={className} />;
    case "engineering":
      return <IconRuler className={className} />;
    case "billing":
      return <IconCoins className={className} />;
    case "welfare":
      return <IconHeartHands className={className} />;
    case "education":
      return <IconGraduationCap className={className} />;
    case "environment":
      return <IconLeaf className={className} />;
    default:
      return <IconBriefcase className={className} />;
  }
}
