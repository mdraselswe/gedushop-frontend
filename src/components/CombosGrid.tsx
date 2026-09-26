"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownUp, Check, ChevronDown, PackageOpen, SlidersHorizontal, X } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import { useInStock } from "@/context/InStockContext";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeStoreProduct } from "@/lib/decode";
import { comboSaving, isCombo } from "@/lib/wp";
import type { StoreProduct } from "@/lib/types";
import { useDialogFocus } from "@/lib/useDialogFocus";

const SORTS = [
  { key: "saving", label: "Biggest saving" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating", label: "Customer rating" },
  { key: "title", label: "Name: A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PRICE_PRESETS = [
  { label: "Under ৳500", min: "", max: "500" },
  { label: "৳500 – ৳1000", min: "500", max: "1000" },
  { label: "৳1000 – ৳2000", min: "1000", max: "2000" },
  { label: "Over ৳2000", min: "2000", max: "" },
];

function productPrice(product: StoreProduct) {
  return Number(product.prices.price) / 10 ** (product.prices.currency_minor_unit ?? 2);
}

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
  const { inStockOnly, setInStockOnly } = useInStock();
  const [sort, setSort] = useState<SortKey>("saving");
  const [onSale, setOnSale] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterDialogRef = useDialogFocus<HTMLDivElement>(filterOpen);

  useEffect(() => {
    let live = true;
    void apiFetch(`${STORE_API}/products?per_page=100`)
      .then((r) => (r.ok ? (r.json() as Promise<StoreProduct[]>) : null))
      .then((all) => {
        if (live && all) setCombos(all.map(decodeStoreProduct).filter(isCombo));
      })
      .catch(() => {
        // Leave the build's list standing — slightly old beats empty.
      });
    return () => {
      live = false;
    };
  }, []);

  const filtered = combos.filter((product) => {
    const price = productPrice(product);
    if (inStockOnly && (!product.is_in_stock || !product.is_purchasable)) return false;
    if (onSale && !product.on_sale) return false;
    if (freeShipping && !product.extensions?.gedushop?.free_shipping) return false;
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return productPrice(a) - productPrice(b);
    if (sort === "price_desc") return productPrice(b) - productPrice(a);
    if (sort === "rating") return Number(b.average_rating) - Number(a.average_rating);
    if (sort === "title") return a.name.localeCompare(b.name);
    return comboSaving(b) - comboSaving(a);
  });

  const activeCount =
    (onSale ? 1 : 0) +
    (freeShipping ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0);

  const clearAll = () => {
    setOnSale(false);
    setFreeShipping(false);
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
  };

  const sortLabel = SORTS.find((option) => option.key === sort)!.label;

  if (combos.length === 0) {
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
    <div className="space-y-3">
      <div className="fancy-surface flex items-center justify-between gap-2 rounded-xl p-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-plum-700 shadow-sm ring-1 ring-plum-100 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] hover:ring-coral-300"
        >
          <SlidersHorizontal className="size-4" strokeWidth={2.25} />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-coral-500 text-[11px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-bold text-plum-400 sm:inline">{sorted.length} combos</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-plum-700 shadow-sm ring-1 ring-plum-100 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] hover:ring-coral-300"
            >
              <ArrowDownUp className="size-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Sort:</span> {sortLabel}
              <ChevronDown className={`size-4 transition-transform ${sortOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-[var(--shadow-lift)] ring-1 ring-plum-100">
                  {SORTS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setSort(option.key);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-plum-50 ${
                        sort === option.key ? "text-coral-600" : "text-plum-700"
                      }`}
                    >
                      {option.label}
                      {sort === option.key && <Check className="size-4" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(minPrice || maxPrice) && (
            <Chip
              label={`৳${minPrice || "0"} – ${maxPrice ? `৳${maxPrice}` : "∞"}`}
              onRemove={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
            />
          )}
          {inStockOnly && <Chip label="In stock" onRemove={() => setInStockOnly(false)} />}
          {onSale && <Chip label="Deals & Offers" onRemove={() => setOnSale(false)} />}
          {freeShipping && <Chip label="Free delivery" onRemove={() => setFreeShipping(false)} />}
          <button type="button" onClick={clearAll} className="text-xs font-bold text-plum-400 underline hover:text-coral-500">
            Clear all
          </button>
        </div>
      )}

      {sorted.length > 0 ? (
        <ProductGrid products={sorted} respectStockFilter={false} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-12 text-center shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <PackageOpen className="size-10 text-plum-200" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-plum-500">No combo offers match these filters.</p>
          <button type="button" onClick={clearAll} className="mt-2 rounded-full bg-plum-600 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-plum-700">
            Clear filters
          </button>
        </div>
      )}

      {filterOpen && (
        <div ref={filterDialogRef} tabIndex={-1} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Combo filters">
          <div className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[24rem] sm:rounded-none">
            <div className="sticky top-0 flex items-center justify-between border-b border-plum-100 bg-white px-5 py-4">
              <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">Filters</h2>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-plum-500 hover:bg-plum-50">
                <X className="size-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-6 px-5 py-5">
              <Section title="Price">
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map((preset) => (
                    <PillToggle
                      key={preset.label}
                      active={minPrice === preset.min && maxPrice === preset.max}
                      onClick={() => {
                        setMinPrice(preset.min);
                        setMaxPrice(preset.max);
                      }}
                    >
                      {preset.label}
                    </PillToggle>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="number" inputMode="numeric" min={0} placeholder="Min ৳" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="w-full rounded-xl border border-plum-100 px-3 py-2 text-sm font-semibold text-plum-700 outline-none" />
                  <span className="text-plum-300">–</span>
                  <input type="number" inputMode="numeric" min={0} placeholder="Max ৳" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="w-full rounded-xl border border-plum-100 px-3 py-2 text-sm font-semibold text-plum-700 outline-none" />
                </div>
              </Section>

              <Section title="Availability & offers">
                <div className="flex flex-col gap-2">
                  <CheckRow label="In stock only" checked={inStockOnly} onChange={setInStockOnly} />
                  <CheckRow label="Deals & Offers" checked={onSale} onChange={setOnSale} />
                  <CheckRow label="Free delivery included" checked={freeShipping} onChange={setFreeShipping} />
                </div>
              </Section>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-plum-100 bg-white px-5 py-4">
              <button type="button" onClick={clearAll} className="flex-1 rounded-full py-3 text-sm font-extrabold text-plum-600 ring-1 ring-plum-200 hover:bg-plum-50">
                Clear all
              </button>
              <button type="button" onClick={() => setFilterOpen(false)} className="flex-1 rounded-full bg-coral-500 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] hover:bg-coral-600">
                Show {sorted.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1.5 text-xs font-bold text-coral-600">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded-full hover:bg-coral-100">
        <X className="size-3.5" strokeWidth={2.5} />
      </button>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-plum-400">{title}</h3>
      {children}
    </div>
  );
}

function PillToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-coral-500 text-white" : "bg-plum-50 text-plum-600 hover:bg-plum-100"
      }`}
    >
      {children}
    </button>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 py-1 text-left">
      <span className={`flex size-5 items-center justify-center rounded-md transition-colors ${checked ? "bg-coral-500" : "ring-1 ring-plum-300"}`}>
        {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm font-semibold text-plum-700">{label}</span>
    </button>
  );
}
