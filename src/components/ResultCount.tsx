"use client";

import { useInStock } from "@/context/InStockContext";
import type { StoreProduct } from "@/lib/types";

/** Product count that reflects the "In stock only" filter on client-filtered listings. */
export default function ResultCount({ products, total }: { products: StoreProduct[]; total: number }) {
  const { inStockOnly } = useInStock();
  const n = inStockOnly ? products.filter((p) => p.is_in_stock && p.is_purchasable).length : total;
  return <span className="text-xs font-bold text-plum-400">{n} products</span>;
}
