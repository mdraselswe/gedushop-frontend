"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal, X, Check, ArrowDownUp } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { apiFetch, GEDU_API, STORE_API } from "@/lib/api";
import { decodeEntities } from "@/lib/decode";
import { fetchProductCollection } from "@/lib/productSearch";
import { useInStock } from "@/context/InStockContext";
import type { StoreCategory, StoreProduct } from "@/lib/types";
import { useDialogFocus } from "@/lib/useDialogFocus";

const PER_PAGE = 24;
const MINOR = 100; // BDT minor unit (2) → Store API price filters are in the smallest unit

const SORTS = [
  { key: "relevance", label: "Relevance", orderby: "relevance", order: "desc" },
  { key: "popularity", label: "Popular", orderby: "popularity", order: "desc" },
  { key: "date", label: "Newest", orderby: "date", order: "desc" },
  { key: "price_asc", label: "Price: Low to High", orderby: "price", order: "asc" },
  { key: "price_desc", label: "Price: High to Low", orderby: "price", order: "desc" },
  { key: "rating", label: "Top Rated", orderby: "rating", order: "desc" },
  { key: "discount", label: "Biggest Discount", orderby: "discount_percent", order: "desc" },
  { key: "saving", label: "Biggest Saving", orderby: "discount_amount", order: "desc" },
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
  const [freeShipping, setFreeShipping] = useState(false);
  const [minRating, setMinRating] = useState("");
  const [age, setAge] = useState("");
  const [cat, setCat] = useState(categoryId ?? "");
  const [page, setPage] = useState(initialPage);

  const [products, setProducts] = useState<StoreProduct[]>(initialProducts ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [totalPages, setTotalPages] = useState(initialTotal ? Math.ceil(initialTotal / PER_PAGE) : 1);
  const [loading, setLoading] = useState(initialProducts == null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterDialogRef = useDialogFocus<HTMLDivElement>(filterOpen);
  const [sortOpen, setSortOpen] = useState(false);
  const seeded = useRef(initialProducts != null);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const sortOptions = search ? SORTS : SORTS.filter((option) => option.key !== "relevance");

  // Shop page has no fixed category → load the list for the category picker.
  const [catList, setCatList] = useState<StoreCategory[]>(categories);
  const [ageOptions, setAgeOptions] = useState<Record<string, string>>({});
  useEffect(() => {
    if (categoryId || catList.length) return;
    apiFetch(`${STORE_API}/products/categories?per_page=50&orderby=name`)
      .then((r) => (r.ok ? r.json() : []))
      .then((cs: StoreCategory[]) =>
        setCatList(cs.filter((c) => c.count > 0).map((c) => ({ ...c, name: decodeEntities(c.name) }))),
      )
      .catch(() => {});
  }, [categoryId, catList.length]);

  useEffect(() => {
    apiFetch(`${GEDU_API}/product-filter-options`, undefined, 2)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ages?: Record<string, string> } | null) => setAgeOptions(data?.ages ?? {}))
      .catch(() => {
        // Age filters stay hidden until the catalogue and plugin expose them.
      });
  }, []);

  useEffect(() => {
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedSort = params.get("sort");
      if (requestedSort && SORTS.some((option) => option.key === requestedSort)) {
        setSort(requestedSort as SortKey);
      } else {
        setSort(defaultSort);
      }
      setOnSale(params.get("sale") === "1" || defaultOnSale);
      setMinPrice(params.get("min_price") ?? "");
      setMaxPrice(params.get("max_price") ?? "");
      setFreeShipping(params.get("free_delivery") === "1");
      setMinRating(params.get("rating") ?? "");
      setAge(params.get("age") ?? "");
      if (params.get("stock") === "1") setInStockOnly(true);
      if (!categoryId) setCat(params.get("category") ?? "");
      const hasInteractiveState = ["sort", "sale", "stock", "free_delivery", "rating", "age", "min_price", "max_price", "category", "search"].some((key) => params.has(key));
      setPage(hasInteractiveState ? 1 : initialPage);
      setUrlHydrated(true);
    };

    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [categoryId, defaultOnSale, defaultSort, initialPage, setInStockOnly]);

  useEffect(() => {
    if (!urlHydrated) return;
    const params = new URLSearchParams(window.location.search);
    const setOptional = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };

    setOptional("sale", onSale ? "1" : "");
    setOptional("stock", inStockOnly ? "1" : "");
    setOptional("free_delivery", freeShipping ? "1" : "");
    setOptional("rating", minRating);
    setOptional("age", age);
    setOptional("min_price", minPrice);
    setOptional("max_price", maxPrice);
    if (!categoryId) setOptional("category", cat);

    if (sort === "popularity" || (search && sort === "relevance")) params.delete("sort");
    else params.set("sort", sort);

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  }, [age, cat, categoryId, freeShipping, inStockOnly, maxPrice, minPrice, minRating, onSale, search, sort, urlHydrated]);

  const fetchProducts = useCallback((quiet = false) => {
    // A quiet pass refreshes a list that is already on screen. Showing the
    // skeleton there would replace real products with a loading state to fetch
    // very nearly the same thing — a step backwards for the reader.
    if (!quiet) setLoading(true);
    setLoadFailed(false);
    const q = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
    if (cat) q.set("category", cat);
    if (search) q.set("search", search);
    if (onSale) q.set("on_sale", "true");
    if (inStockOnly) q.set("stock_status", "instock");
    if (freeShipping) q.set("free_shipping", "true");
    if (minRating) q.set("min_rating", minRating);
    if (age) q.set("age", age);
    if (minPrice) q.set("min_price", String(Math.round(Number(minPrice) * MINOR)));
    if (maxPrice) q.set("max_price", String(Math.round(Number(maxPrice) * MINOR)));
    const s = SORTS.find((x) => x.key === sort) ?? SORTS[0];
    q.set("orderby", s.orderby);
    q.set("order", s.order);

    fetchProductCollection(q)
      .then(async (r) => {
        // An upstream outage is not an empty catalogue. Treating a 403/5xx as
        // zero results used to erase the perfectly good build-time list and
        // intermittently show "No products found" to every shopper.
        if (!r.ok) throw new Error(`Product API returned ${r.status}`);
        const list: StoreProduct[] = await r.json();
        return {
          list: Array.isArray(list) ? list.map((p) => ({ ...p, name: decodeEntities(p.name) })) : [],
          pages: Number(r.headers.get("x-wp-totalpages") ?? 1),
          count: Number(r.headers.get("x-wp-total") ?? (Array.isArray(list) ? list.length : 0)),
        };
      })
      .then(({ list, pages, count }) => {
        setLoadFailed(false);
        setProducts(list);
        setTotalPages(pages);
        setTotal(count);
      })
      .catch(() => {
        // Keep the last known-good products on screen. This applies to quiet
        // initial refreshes and filter changes: a temporary WordPress/Hostinger
        // failure must never masquerade as a real empty search result.
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [age, cat, search, onSale, inStockOnly, freeShipping, minRating, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    if (!urlHydrated) return;
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
  }, [fetchProducts, urlHydrated]);

  // Any filter/sort change resets to page 1.
  const resetPage = () => setPage(1);

  const activeCount =
    (onSale ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (freeShipping ? 1 : 0) +
    (minRating ? 1 : 0) +
    (age ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (!categoryId && cat ? 1 : 0);

  const clearAll = () => {
    setOnSale(false);
    setInStockOnly(false);
    setFreeShipping(false);
    setMinRating("");
    setAge("");
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
      <div className="fancy-surface flex items-center justify-between gap-2 rounded-xl p-2">
        <button
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
          {!loading && <span className="hidden text-xs font-bold text-plum-400 sm:inline">{total} products</span>}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
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
                  {sortOptions.map((s) => (
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
          {freeShipping && <Chip label="Free delivery" onRemove={() => { setFreeShipping(false); resetPage(); }} />}
          {minRating && <Chip label={`${minRating}★ & above`} onRemove={() => { setMinRating(""); resetPage(); }} />}
          {age && <Chip label={`Age: ${ageOptions[age] ?? age}`} onRemove={() => { setAge(""); resetPage(); }} />}
          <button onClick={clearAll} className="text-xs font-bold text-plum-400 underline hover:text-coral-500">
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {loadFailed && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {products.length > 0
              ? "Products could not be refreshed. Showing the last available results."
              : "Products are temporarily unavailable. Please try again."}
          </span>
          <button
            type="button"
            onClick={() => fetchProducts(false)}
            className="w-fit rounded-full bg-amber-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-amber-800"
          >
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <ProductGridSkeleton count={24} />
      ) : (
        <>
          <ProductGrid products={products} respectStockFilter={false} />
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
                !freeShipping &&
                !minRating &&
                !age &&
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
        <div ref={filterDialogRef} tabIndex={-1} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Filters">
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
                    className="w-full rounded-xl border border-plum-100 px-3 py-2 text-sm font-semibold text-plum-700 outline-none"
                  />
                  <span className="text-plum-300">–</span>
                  <input
                    type="number" inputMode="numeric" min={0} placeholder="Max ৳"
                    value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); resetPage(); }}
                    className="w-full rounded-xl border border-plum-100 px-3 py-2 text-sm font-semibold text-plum-700 outline-none"
                  />
                </div>
              </Section>

              <Section title="Customer rating">
                <div className="flex flex-wrap gap-2">
                  {["4", "3"].map((rating) => (
                    <PillToggle key={rating} active={minRating === rating} onClick={() => { setMinRating(minRating === rating ? "" : rating); resetPage(); }}>
                      {rating}★ & above
                    </PillToggle>
                  ))}
                </div>
              </Section>

              {Object.keys(ageOptions).length > 0 && (
                <Section title="Recommended age">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ageOptions).map(([key, label]) => (
                      <PillToggle key={key} active={age === key} onClick={() => { setAge(age === key ? "" : key); resetPage(); }}>
                        {label}
                      </PillToggle>
                    ))}
                  </div>
                </Section>
              )}

              {/* Availability / offers */}
              <Section title="Availability">
                <div className="flex flex-col gap-2">
                  <CheckRow label="In stock only" checked={inStockOnly} onChange={(v) => { setInStockOnly(v); resetPage(); }} />
                  <CheckRow label="Deals & Offers" checked={onSale} onChange={(v) => { setOnSale(v); resetPage(); }} />
                  <CheckRow label="Free delivery included" checked={freeShipping} onChange={(v) => { setFreeShipping(v); resetPage(); }} />
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
