"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CategoryChips from "@/components/CategoryChips";
import Pagination from "@/components/Pagination";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeEntities } from "@/lib/decode";
import type { StoreCategory, StoreProduct } from "@/lib/types";

const PER_PAGE = 24;

function ShopInner() {
  const params = useSearchParams();
  const category = params.get("category") ?? undefined;
  const search = params.get("search") ?? undefined;
  const sale = params.get("sale") === "1";
  const sort = params.get("sort") ?? undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${STORE_API}/products/categories?per_page=50`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: StoreCategory[]) =>
        setCategories(d.filter((c) => c.count > 0).map((c) => ({ ...c, name: decodeEntities(c.name) }))),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
    if (category) q.set("category", category);
    if (search) q.set("search", search);
    if (sale) q.set("on_sale", "true");
    if (sort) q.set("orderby", sort);

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
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, search, sale, sort, page]);

  const title = search ? `Results for “${search}”` : sale ? "Flash Sales" : sort === "date" ? "New Arrivals" : "Shop";

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">{title}</h1>
        {!loading && <span className="text-xs font-bold text-plum-400">{total} products</span>}
      </div>
      <div className="lg:hidden">
        <CategoryChips categories={categories} activeId={category ? Number(category) : undefined} />
      </div>
      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : (
        <>
          <ProductGrid products={products} reveal />
          <Pagination current={page} totalPages={totalPages} baseParams={{ category, search, sale: sale ? "1" : undefined, sort }} />
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-4"><ProductGridSkeleton count={12} /></div>}>
      <ShopInner />
    </Suspense>
  );
}
