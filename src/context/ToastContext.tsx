"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

type Variant = "success" | "error";
interface Toast {
  id: number;
  message: string;
  variant: Variant;
}

const ToastContext = createContext<{ show: (message: string, variant?: Variant) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, variant: Variant = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), variant === "error" ? 3200 : 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[80] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex max-w-md items-center gap-2 rounded-2xl bg-plum-800/95 px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-lift)] backdrop-blur"
            style={{ animation: "toast-in 0.25s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full shadow-sm ${
                t.variant === "error"
                  ? "bg-coral-500 shadow-coral-500/40"
                  : "bg-emerald-500 shadow-emerald-500/40"
              }`}
              style={{ animation: "badge-pop 0.35s cubic-bezier(0.22,1,0.36,1)" }}
            >
              {t.variant === "error" ? (
                <TriangleAlert className="size-3.5" strokeWidth={3} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 24,
                      animation: "check-draw 0.4s 0.14s cubic-bezier(0.65,0,0.35,1) forwards",
                    }}
                  />
                </svg>
              )}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Optional — components can call show() only when a provider is present.
  return ctx ?? { show: () => {} };
}
