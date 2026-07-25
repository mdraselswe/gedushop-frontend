"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getRecent, type RecentItem } from "@/lib/recentlyViewed";

/** Horizontal "Recently viewed" strip, read from localStorage. Hidden if empty. */
export default function RecentlyViewed({ excludeSlug, title = "Recently viewed" }: { excludeSlug?: string; title?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(getRecent().filter((x) => x.slug !== excludeSlug));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-plum-800">{title}</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
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
