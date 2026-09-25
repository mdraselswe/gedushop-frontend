import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="checkout-route min-h-dvh w-full bg-[#fffaf8]">
      <header className="border-b border-plum-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Back to GeduShop">
            <Image src="/logo-light.png" alt="GeduShop" width={77} height={56} className="h-11 w-auto" priority />
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-bold text-plum-500">
            <LockKeyhole className="size-4 text-emerald-600" strokeWidth={2.25} />
            Secure checkout
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
