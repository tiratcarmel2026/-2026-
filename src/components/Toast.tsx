"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconAlertCircle, IconCheckCircle, IconX } from "@/lib/icons";

type ToastKind = "error" | "success" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 px-4"
        aria-live="assertive"
        role="region"
        aria-label="התראות"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`animate-toast-in flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              t.kind === "error"
                ? "border-brand-red/30 bg-red-50 text-brand-red"
                : t.kind === "success"
                  ? "border-brand-green/30 bg-brand-green-light text-brand-green"
                  : "border-brand-blue/30 bg-brand-blue-light text-brand-blue"
            }`}
          >
            {t.kind === "success" ? (
              <IconCheckCircle className="mt-0.5 size-5 shrink-0" />
            ) : (
              <IconAlertCircle className="mt-0.5 size-5 shrink-0" />
            )}
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="סגירת הודעה"
              className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100"
            >
              <IconX className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
