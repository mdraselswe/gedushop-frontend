"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { StoreCategory } from "@/lib/types";
import { categoryIcon, Flame, Sparkles, Zap } from "@/lib/categoryIcons";

const COLLECTIONS = [
  { href: "/", label: "Popular", Icon: Flame },
  { href: "/shop?sale=1", label: "Flash Sales", Icon: Zap },
  { href: "/shop?sort=date", label: "New Arrivals", Icon: Sparkles },
] as const;

function SidebarInner({ categories }: { categories: StoreCategory[] }) {
  // trailingSlash:true makes paths like "/shop/" — normalize for comparison.
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const params = useSearchParams();
  const onShop = pathname === "/shop";

  const itemCls = (active: boolean) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
      active ? "bg-plum-600 text-white" : "text-plum-700 hover:bg-plum-50"
    }`;

  return (
    <aside className="sticky top-[4.2rem] hidden h-[calc(100vh-4.2rem)] w-64 shrink-0 overflow-y-auto border-r border-plum-100/60 bg-white px-3 py-4 lg:block xl:w-72">
      <nav className="space-y-1">
        {COLLECTIONS.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : onShop &&
                (href.includes("sale=1") ? params.get("sale") === "1" : params.get("sort") === "date");
          return (
            <Link key={label} href={href} className={itemCls(active)}>
              <Icon className={`size-4.5 ${active ? "" : "text-coral-500"}`} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-5 px-3 text-[11px] font-extrabold uppercase tracking-wider text-plum-300">
        Categories
      </p>
      <nav className="mt-1.5 space-y-1">
        {categories.map((c) => {
          const Icon = categoryIcon(c.slug);
          const active = pathname === `/category/${c.slug}`;
          return (
            <Link key={c.id} href={`/category/${c.slug}`} className={itemCls(active)}>
              <Icon className={`size-4.5 shrink-0 ${active ? "" : "text-plum-400"}`} strokeWidth={2} />
              <span className="flex-1 leading-tight">{c.name}</span>
              <span className={`shrink-0 text-[11px] font-bold ${active ? "text-white/80" : "text-plum-300"}`}>
                {c.count}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function Sidebar({ categories }: { categories: StoreCategory[] }) {
  return (
    <Suspense fallback={<aside className="hidden w-64 shrink-0 lg:block xl:w-72" />}>
      <SidebarInner categories={categories} />
    </Suspense>
  );
}
