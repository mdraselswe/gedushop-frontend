"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

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
              className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                t.variant === "error" ? "bg-coral-500" : "bg-emerald-500"
              }`}
            >
              {t.variant === "error" ? (
                <TriangleAlert className="size-3" strokeWidth={3} />
              ) : (
                <Check className="size-3.5" strokeWidth={3} />
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
