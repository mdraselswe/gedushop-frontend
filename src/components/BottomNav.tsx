"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, PackageSearch } from "lucide-react";
import type { StoreCategory } from "@/lib/types";
import { HomeIcon, ShopIcon } from "./Icons";
import CategorySheet from "./CategorySheet";

export default function BottomNav({ categories }: { categories: StoreCategory[] }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [sheetOpen, setSheetOpen] = useState(false);

  const itemCls = (active: boolean) =>
    `relative flex flex-col items-center gap-1 py-2 text-[11px] font-bold transition-colors ${
      active ? "text-coral-500" : "text-plum-400"
    }`;

  return (
    <>
      <nav className="site-chrome fixed inset-x-3 bottom-3 z-40 overflow-hidden rounded-2xl border border-plum-100/80 bg-white/94 pb-[env(safe-area-inset-bottom)] shadow-[0_8px_24px_rgba(47,39,73,0.1)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4 px-1">
          {/* Home */}
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={itemCls(pathname === "/")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/" ? "bg-coral-50" : ""}`}>
              <HomeIcon className="size-5.5" />
            </span>
            Home
          </Link>

          {/* Shop */}
          <Link href="/shop" aria-current={pathname === "/shop" ? "page" : undefined} className={itemCls(pathname === "/shop")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/shop" ? "bg-coral-50" : ""}`}>
              <ShopIcon className="size-5.5" />
            </span>
            Shop
          </Link>

          {/* Categories — opens bottom sheet */}
          <button onClick={() => setSheetOpen(true)} className={itemCls(sheetOpen)} aria-label="Browse categories">
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${sheetOpen ? "bg-coral-50" : ""}`}>
              <LayoutGrid className="size-5.5" strokeWidth={2} />
            </span>
            Categories
          </button>

          {/* My Orders — the list, which falls back to the single-order lookup when empty */}
          <Link href="/my-orders" aria-current={pathname === "/my-orders" ? "page" : undefined} className={itemCls(pathname === "/my-orders")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/my-orders" ? "bg-coral-50" : ""}`}>
              <PackageSearch className="size-5.5" strokeWidth={2} />
            </span>
            Orders
          </Link>
        </div>
      </nav>

      <CategorySheet open={sheetOpen} onClose={() => setSheetOpen(false)} categories={categories} />
    </>
  );
}
