"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StoreCategory } from "@/lib/types";
import { categoryIcon, LayoutGrid } from "@/lib/categoryIcons";

export default function CategoryChips({ categories }: { categories: StoreCategory[] }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const chipCls = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
      active ? "bg-plum-600 text-white" : "bg-white text-plum-600 border border-plum-100 hover:border-plum-300"
    }`;

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      <Link href="/shop" className={chipCls(pathname === "/shop")}>
        <LayoutGrid className="size-4" strokeWidth={2.25} /> All
      </Link>
      {categories.map((c) => {
        const Icon = categoryIcon(c.slug);
        return (
          <Link key={c.id} href={`/category/${c.slug}`} className={chipCls(pathname === `/category/${c.slug}`)}>
            <Icon className="size-4" strokeWidth={2.25} /> {c.name}
          </Link>
        );
      })}
    </div>
  );
}
