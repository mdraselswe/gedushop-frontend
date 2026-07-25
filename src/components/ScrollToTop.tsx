"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!shown) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-11 items-center justify-center rounded-full bg-white text-plum-600 shadow-[var(--shadow-lift)] ring-1 ring-plum-100 transition-transform hover:-translate-y-0.5 hover:text-coral-500 md:bottom-6 md:right-6"
    >
      <ArrowUp className="size-5" strokeWidth={2.5} />
    </button>
  );
}
