import { IconCheckCircle } from "@/lib/icons";

interface Props {
  steps: string[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: Props) {
  return (
    <ol className="mb-8 flex items-center" aria-label="שלבי קביעת התור">
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  done
                    ? "border-brand-green bg-brand-green text-white"
                    : active
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <IconCheckCircle className="size-4" /> : i + 1}
              </span>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  active ? "text-brand-blue" : done ? "text-brand-green" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`mx-2 h-0.5 flex-1 rounded ${done ? "bg-brand-green" : "bg-gray-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
