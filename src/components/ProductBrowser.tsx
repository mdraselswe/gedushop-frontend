"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal, X, Check, ArrowDownUp } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeEntities } from "@/lib/decode";
import { useInStock } from "@/context/InStockContext";
import type { StoreCategory, StoreProduct } from "@/lib/types";

const PER_PAGE = 24;
const MINOR = 100; // BDT minor unit (2) → Store API price filters are in the smallest unit

const SORTS = [
  { key: "popularity", label: "Popular", orderby: "popularity", order: "desc" },
  { key: "date", label: "Newest", orderby: "date", order: "desc" },
  { key: "price_asc", label: "Price: Low to High", orderby: "price", order: "asc" },
  { key: "price_desc", label: "Price: High to Low", orderby: "price", order: "desc" },
  { key: "title", label: "Name: A–Z", orderby: "title", order: "asc" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PRICE_PRESETS = [
  { label: "Under ৳200", min: "", max: "200" },
  { label: "৳200 – ৳500", min: "200", max: "500" },
  { label: "৳500 – ৳1000", min: "500", max: "1000" },
  { label: "Over ৳1000", min: "1000", max: "" },
];

interface Props {
  /** Fixed category (category page) — hides the category picker. */
  categoryId?: string;
  search?: string;
  /** Category page seeds the first render (SEO SSR) so we skip the initial fetch. */
  initialProducts?: StoreProduct[];
  initialTotal?: number;
  /** Categories for the picker on the shop page. */
  categories?: StoreCategory[];
  defaultSort?: SortKey;
  defaultOnSale?: boolean;
  /** Initial page and clean URL base used by statically generated pagination. */
  initialPage?: number;
  paginationBase?: string;
}

export default function ProductBrowser({
  categoryId,
  search,
  initialProducts,
  initialTotal,
  categories = [],
  defaultSort = "popularity",
  defaultOnSale = false,
  initialPage = 1,
  paginationBase,
}: Props) {
  const { inStockOnly, setInStockOnly } = useInStock();

  const [sort, setSort] = useState<SortKey>(defaultSort);
  const [onSale, setOnSale] = useState(defaultOnSale);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cat, setCat] = useState(categoryId ?? "");
  const [page, setPage] = useState(initialPage);

  const [products, setProducts] = useState<StoreProduct[]>(initialProducts ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [totalPages, setTotalPages] = useState(initialTotal ? Math.ceil(initialTotal / PER_PAGE) : 1);
  const [loading, setLoading] = useState(initialProducts == null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const seeded = useRef(initialProducts != null);

  // Shop page has no fixed category → load the list for the category picker.
  const [catList, setCatList] = useState<StoreCategory[]>(categories);
  useEffect(() => {
    if (categoryId || catList.length) return;
    apiFetch(`${STORE_API}/products/categories?per_page=50&orderby=name`)
      .then((r) => (r.ok ? r.json() : []))
      .then((cs: StoreCategory[]) =>
        setCatList(cs.filter((c) => c.count > 0).map((c) => ({ ...c, name: decodeEntities(c.name) }))),
      )
      .catch(() => {});
  }, [categoryId, catList.length]);

  const fetchProducts = useCallback((quiet = false) => {
    // A quiet pass refreshes a list that is already on screen. Showing the
    // skeleton there would replace real products with a loading state to fetch
    // very nearly the same thing — a step backwards for the reader.
    if (!quiet) setLoading(true);
    const q = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
    if (cat) q.set("category", cat);
    if (search) q.set("search", search);
    if (onSale) q.set("on_sale", "true");
    if (inStockOnly) q.set("stock_status", "instock");
    if (minPrice) q.set("min_price", String(Math.round(Number(minPrice) * MINOR)));
    if (maxPrice) q.set("max_price", String(Math.round(Number(maxPrice) * MINOR)));
    const s = SORTS.find((x) => x.key === sort)!;
    q.set("orderby", s.orderby);
    q.set("order", s.order);

    apiFetch(`${STORE_API}/products?${q}`)
      .then(async (r) => {
        if (!r.ok) return { list: [], pages: 1, count: 0 };
        const list: StoreProduct[] = await r.json();
        return {
          list: list.map((p) => ({ ...p, name: decodeEntities(p.name) })),
          pages: Number(r.headers.get("x-wp-totalpages") ?? 1),
          count: Number(r.headers.get("x-wp-total") ?? list.length),
        };
      })
      .then(({ list, pages, count }) => {
        setProducts(list);
        setTotalPages(pages);
        setTotal(count);
      })
      // A failed quiet refresh leaves the build's list standing: slightly old
      // beats empty. A failed first load has nothing to fall back to.
      .catch(() => {
        if (!quiet) setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [cat, search, onSale, inStockOnly, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    // A category page arrives with the products the build knew about, which is
    // what a crawler should see and what paints first. It is not what the shop
    // sells now: these pages are written at build time and the catalogue keeps
    // moving, so a combo published an hour ago was missing from the very page
    // meant to list it until something else triggered a rebuild.
    //
    // So the seeded first pass still fetches — quietly, leaving the build's
    // products on screen until the shop answers.
    const quiet = seeded.current;
    seeded.current = false;
    fetchProducts(quiet);
  }, [fetchProducts]);

  // Any filter/sort change resets to page 1.
  const resetPage = () => setPage(1);

  const activeCount =
    (onSale ? 1 : 0) + (inStockOnly ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (!categoryId && cat ? 1 : 0);

  const clearAll = () => {
    setOnSale(false);
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    if (!categoryId) setCat("");
    resetPage();
  };

  const sortLabel = SORTS.find((s) => s.key === sort)!.label;
  const catName = catList.find((c) => String(c.id) === cat)?.name;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-plum-700 ring-1 ring-plum-200 transition-colors hover:ring-coral-300"
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
          {!loading && <span className="hidden text-xs font-bold text-plum-400 sm:inline">{total} products</span>}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-plum-700 ring-1 ring-plum-200 transition-colors hover:ring-coral-300"
            >
              <ArrowDownUp className="size-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Sort:</span> {sortLabel}
              <ChevronDown className={`size-4 transition-transform ${sortOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-[var(--shadow-lift)] ring-1 ring-plum-100">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSort(s.key);
                        resetPage();
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-plum-50 ${
                        sort === s.key ? "text-coral-600" : "text-plum-700"
                      }`}
                    >
                      {s.label}
                      {sort === s.key && <Check className="size-4" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {!categoryId && cat && catName && (
            <Chip label={catName} onRemove={() => { setCat(""); resetPage(); }} />
          )}
          {(minPrice || maxPrice) && (
            <Chip
              label={`৳${minPrice || "0"} – ${maxPrice ? "৳" + maxPrice : "∞"}`}
              onRemove={() => { setMinPrice(""); setMaxPrice(""); resetPage(); }}
            />
          )}
          {onSale && <Chip label="Deals & Offers" onRemove={() => { setOnSale(false); resetPage(); }} />}
          {inStockOnly && <Chip label="In stock" onRemove={() => { setInStockOnly(false); resetPage(); }} />}
          <button onClick={clearAll} className="text-xs font-bold text-plum-400 underline hover:text-coral-500">
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : (
        <>
          <ProductGrid products={products} reveal respectStockFilter={false} />
          {totalPages > 1 && (
            <ClientPager
              page={page}
              totalPages={totalPages}
              onGo={setPage}
              basePath={
                paginationBase &&
                !search &&
                !onSale &&
                !inStockOnly &&
                !minPrice &&
                !maxPrice &&
                (!cat || Boolean(categoryId)) &&
                sort === defaultSort
                  ? paginationBase
                  : undefined
              }
            />
          )}
        </>
      )}

      {/* Filter panel: bottom sheet on mobile, right drawer on sm+ */}
      {filterOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[24rem] sm:rounded-none">
            <div className="sticky top-0 flex items-center justify-between border-b border-plum-100 bg-white px-5 py-4">
              <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">Filters</h2>
              <button onClick={() => setFilterOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-plum-500 hover:bg-plum-50">
                <X className="size-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-6 px-5 py-5">
              {/* Category (shop only) */}
              {!categoryId && catList.length > 0 && (
                <Section title="Category">
                  <div className="flex flex-wrap gap-2">
                    <PillToggle active={!cat} onClick={() => { setCat(""); resetPage(); }}>All</PillToggle>
                    {catList.map((c) => (
                      <PillToggle key={c.id} active={cat === String(c.id)} onClick={() => { setCat(String(c.id)); resetPage(); }}>
                        {c.name}
                      </PillToggle>
                    ))}
                  </div>
                </Section>
              )}

              {/* Price */}
              <Section title="Price">
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map((p) => {
                    const active = minPrice === p.min && maxPrice === p.max;
                    return (
                      <PillToggle key={p.label} active={active} onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); resetPage(); }}>
                        {p.label}
                      </PillToggle>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number" inputMode="numeric" min={0} placeholder="Min ৳"
                    value={minPrice} onChange={(e) => { setMinPrice(e.target.value); resetPage(); }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-plum-700 ring-1 ring-plum-200 focus:outline-none focus:ring-coral-400"
                  />
                  <span className="text-plum-300">–</span>
                  <input
                    type="number" inputMode="numeric" min={0} placeholder="Max ৳"
                    value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); resetPage(); }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-plum-700 ring-1 ring-plum-200 focus:outline-none focus:ring-coral-400"
                  />
                </div>
              </Section>

              {/* Availability / offers */}
              <Section title="Availability">
                <div className="flex flex-col gap-2">
                  <CheckRow label="In stock only" checked={inStockOnly} onChange={(v) => { setInStockOnly(v); resetPage(); }} />
                  <CheckRow label="Deals & Offers" checked={onSale} onChange={(v) => { setOnSale(v); resetPage(); }} />
                </div>
              </Section>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-plum-100 bg-white px-5 py-4">
              <button onClick={clearAll} className="flex-1 rounded-full py-3 text-sm font-extrabold text-plum-600 ring-1 ring-plum-200 hover:bg-plum-50">
                Clear all
              </button>
              <button onClick={() => setFilterOpen(false)} className="flex-1 rounded-full bg-coral-500 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] hover:bg-coral-600">
                Show {total} results
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
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="rounded-full hover:bg-coral-100">
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
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-coral-500 text-white" : "bg-plum-50 text-plum-600 hover:bg-plum-100"
      }`}
    >
      {children}
    </button>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2.5 py-1 text-left">
      <span className={`flex size-5 items-center justify-center rounded-md transition-colors ${checked ? "bg-coral-500" : "ring-1 ring-plum-300"}`}>
        {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm font-semibold text-plum-700">{label}</span>
    </button>
  );
}

/** Simple client-side pager (state-driven, no URL nav) for the browser. */
function ClientPager({
  page,
  totalPages,
  onGo,
  basePath,
}: {
  page: number;
  totalPages: number;
  onGo: (p: number) => void;
  basePath?: string;
}) {
  const go = (p: number) => {
    onGo(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const hrefFor = (p: number) => (p <= 1 ? `${basePath}/` : `${basePath}/page/${p}/`);

  if (basePath) {
    return (
      <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Product pages">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 ring-1 ring-plum-200">
            Prev
          </Link>
        ) : (
          <span className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 opacity-40 ring-1 ring-plum-200">Prev</span>
        )}
        <span className="px-3 text-sm font-bold text-plum-500">{page} / {totalPages}</span>
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 ring-1 ring-plum-200">
            Next
          </Link>
        ) : (
          <span className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 opacity-40 ring-1 ring-plum-200">Next</span>
        )}
      </nav>
    );
  }

  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Filtered product pages">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 ring-1 ring-plum-200 disabled:opacity-40"
      >
        Prev
      </button>
      <span className="px-3 text-sm font-bold text-plum-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full px-3 py-2 text-sm font-bold text-plum-600 ring-1 ring-plum-200 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
