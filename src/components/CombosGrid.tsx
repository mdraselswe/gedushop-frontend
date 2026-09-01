"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { apiFetch, STORE_API } from "@/lib/api";
import { comboSaving, isCombo } from "@/lib/wp";
import type { StoreProduct } from "@/lib/types";

/**
 * The combo listing, refetched in the browser.
 *
 * Built from the catalogue snapshot so the page has real content for a crawler
 * and paints without waiting, then replaced by what the shop says now. Two
 * things go wrong otherwise, and both are visible to a shopper: a combo whose
 * price changed advertises the old one until the next build, and a combo
 * published since the last build is missing from the page whose whole job is
 * listing them.
 *
 * The whole catalogue, rather than the combos this build knew about, because
 * asking for the known ones by id could never turn up a new one.
 */
export default function CombosGrid({ initial }: { initial: StoreProduct[] }) {
  const [combos, setCombos] = useState(initial);
  const { drawerOpen } = useCart();

  useEffect(() => {
    let live = true;
    void apiFetch(`${STORE_API}/products?per_page=100`)
      .then((r) => (r.ok ? (r.json() as Promise<StoreProduct[]>) : null))
      .then((all) => {
        if (live && all) setCombos(all.filter(isCombo));
      })
      .catch(() => {
        // Leave the build's list standing — slightly old beats empty.
      });
    return () => {
      live = false;
    };
  }, []);

  const sorted = [...combos].sort((a, b) => comboSaving(b) - comboSaving(a));

  if (sorted.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
        <p className="font-semibold text-plum-700">No combo offers running right now.</p>
        <Link
          href="/shop"
          className="mt-3 inline-block rounded-full bg-plum-600 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-plum-700"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 ${
        drawerOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"
      }`}
    >
      {sorted.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
