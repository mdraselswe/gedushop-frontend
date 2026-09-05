"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import type { StoreCategory, StoreProduct } from "@/lib/types";

interface Props {
  initialProducts: StoreProduct[];
  initialTotal: number;
  categories: StoreCategory[];
}

function ShopContent({
  initialProducts,
  initialTotal,
  categories,
  search,
  sale = false,
  sortParam,
}: Props & { search?: string; sale?: boolean; sortParam?: string | null }) {
  const defaultSort =
    sortParam === "date" ? "date" : sortParam === "price" ? "price_asc" : "popularity";
  const filtered = Boolean(search || sale || sortParam);
  const title = search
    ? `Results for “${search}”`
    : sale
      ? "Flash Sales"
      : sortParam === "date"
        ? "New Arrivals"
        : "Shop Baby Products & Kids Toys";

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">{title}</h1>
      <ProductBrowser
        key={`${search ?? ""}|${sale ? "1" : ""}|${sortParam ?? ""}`}
        search={search}
        defaultSort={defaultSort}
        defaultOnSale={sale}
        categories={categories}
        initialProducts={filtered ? undefined : initialProducts}
        initialTotal={filtered ? undefined : initialTotal}
        paginationBase="/shop"
      />
    </div>
  );
}

function ShopRoute({ initialProducts, initialTotal, categories }: Props) {
  const params = useSearchParams();
  return (
    <ShopContent
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      categories={categories}
      search={params.get("search") ?? undefined}
      sale={params.get("sale") === "1"}
      sortParam={params.get("sort")}
    />
  );
}

export default function ShopClient(props: Props) {
  // The static exporter suspends useSearchParams. This complete fallback is the
  // exported HTML, so crawlers and no-JS visitors receive the real first page.
  return (
    <Suspense fallback={<ShopContent {...props} />}>
      <ShopRoute {...props} />
    </Suspense>
  );
}
