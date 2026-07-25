"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";

function ShopInner() {
  const params = useSearchParams();
  const search = params.get("search") ?? undefined;
  const sale = params.get("sale") === "1";
  const sortParam = params.get("sort");
  const defaultSort =
    sortParam === "date" ? "date" : sortParam === "price" ? "price_asc" : "popularity";
  const title = search
    ? `Results for “${search}”`
    : sale
      ? "Flash Sales"
      : sortParam === "date"
        ? "New Arrivals"
        : "Shop";

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">{title}</h1>
      <ProductBrowser search={search} defaultSort={defaultSort} defaultOnSale={sale} />
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
