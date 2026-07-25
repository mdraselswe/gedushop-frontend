"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { StoreCategory } from "@/lib/types";
import { categoryIcon, Flame, Sparkles, Zap } from "@/lib/categoryIcons";

const COLLECTIONS = [
  { href: "/", label: "Popular", Icon: Flame },
  { href: "/shop?sale=1", label: "Flash Sales", Icon: Zap },
  { href: "/shop?sort=date", label: "New Arrivals", Icon: Sparkles },
] as const;

export default function CategorySheet({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: StoreCategory[];
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setShown(false);
    setTimeout(onClose, 250);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Categories">
      <div
        className={`absolute inset-0 bg-plum-900/40 backdrop-blur-sm transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-plum-100 bg-white px-5 py-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">Browse</h2>
          <button onClick={close} aria-label="Close" className="rounded-full p-1.5 text-plum-500 hover:bg-plum-50">
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {COLLECTIONS.map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={close}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-plum-50/70 p-3 text-center text-xs font-bold text-plum-700"
              >
                <Icon className="size-5 text-coral-500" strokeWidth={2.25} />
                {label}
              </Link>
            ))}
          </div>

          <p className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-wider text-plum-300">Categories</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/shop"
              onClick={close}
              className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-plum-700 ring-1 ring-plum-100"
            >
              <span className="flex-1">All products</span>
            </Link>
            {categories.map((c) => {
              const Icon = categoryIcon(c.slug);
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={close}
                  className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-plum-700 ring-1 ring-plum-100"
                >
                  <Icon className="size-4.5 shrink-0 text-plum-400" strokeWidth={2} />
                  <span className="flex-1 leading-tight">{c.name}</span>
                  <span className="shrink-0 text-[11px] font-bold text-plum-300">{c.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
