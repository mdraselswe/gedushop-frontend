"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/combos", label: "Combos" },
  { href: "/my-orders", label: "My Orders" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

function HeaderNavInner() {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const params = useSearchParams();

  // "Shop" highlights only on the plain shop listing. When a category / sale /
  // sort / search is active, the sidebar shows the selection instead — so the
  // header tab shouldn't also light up.
  const shopFiltered =
    params.has("category") || params.has("sale") || params.has("sort") || params.has("search");

  function isActive(href: string) {
    if (href === "/shop") return pathname === "/shop" && !shopFiltered;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="ml-auto hidden items-center gap-1 rounded-full border border-plum-100/70 bg-white/70 p-1 text-sm font-semibold shadow-[var(--shadow-soft)] md:flex">
      {LINKS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2 transition-[color,background-color,box-shadow] ${
              active
                ? "bg-white text-coral-600 shadow-[var(--shadow-soft)]"
                : "text-plum-600 hover:bg-white/80 hover:text-coral-500"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function HeaderNav() {
  return (
    <Suspense fallback={<div className="ml-auto hidden md:block" />}>
      <HeaderNavInner />
    </Suspense>
  );
}
