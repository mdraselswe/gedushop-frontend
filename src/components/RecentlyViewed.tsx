"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { getRecent, type RecentItem } from "@/lib/recentlyViewed";

const arrowBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-plum-600 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-colors hover:bg-plum-50 disabled:pointer-events-none disabled:opacity-30";

/** Horizontal "Recently viewed" strip, read from localStorage. Hidden if empty. */
export default function RecentlyViewed({ excludeSlug, title = "Recently viewed" }: { excludeSlug?: string; title?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Touch scrolls fine on its own — these are for the desktop mouse, which
  // has no visible scrollbar here (no-scrollbar) and no swipe gesture, so
  // anything past the first screenful was previously unreachable by mouse.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setItems(getRecent().filter((x) => x.slug !== excludeSlug));
  }, [excludeSlug]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      // A couple of px of slack: a fractional scroll position (subpixel
      // zoom, some browsers) otherwise leaves the end arrow permanently lit.
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // Re-measure once the row actually has cards in it, not just on mount.
  }, [items]);

  function scrollByCards(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.8, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">{title}</h2>
        {(canScrollLeft || canScrollRight) && (
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={() => scrollByCards(-1)} disabled={!canScrollLeft} aria-label="Scroll left" className={arrowBtn}>
              <ChevronLeft className="size-4" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => scrollByCards(1)} disabled={!canScrollRight} aria-label="Scroll right" className={arrowBtn}>
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      <div ref={scrollerRef} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="group w-36 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-plum-50 to-coral-50/40">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full items-center justify-center">
                  <ImageOff className="size-8 text-plum-200" strokeWidth={1.5} />
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-snug text-plum-800">{p.name}</p>
              <p className="mt-1 text-sm font-extrabold text-plum-700 tabular-nums">{p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
