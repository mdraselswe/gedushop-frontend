"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CartIcon, HomeIcon, PhoneIcon, ShopIcon } from "./Icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/shop", label: "Shop", Icon: ShopIcon },
  { href: "/cart", label: "Cart", Icon: CartIcon },
  { href: "/contact", label: "Contact", Icon: PhoneIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const { cart } = useCart();
  const count = cart?.items_count ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-plum-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-bold transition-colors ${
                active ? "text-coral-500" : "text-plum-400"
              }`}
            >
              <span
                className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-coral-50" : ""
                }`}
              >
                <Icon className="size-5.5" />
                {label === "Cart" && count > 0 && (
                  <span className="absolute right-1.5 top-0 flex size-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-extrabold text-white">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
