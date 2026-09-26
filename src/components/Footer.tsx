import Image from "next/image";
import { Suspense } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { StoreCategory } from "@/lib/types";
import { PHONE, PHONE_DISPLAY, WHATSAPP } from "@/lib/contact";
import CookieSettingsButton from "./CookieSettingsButton";
import FooterTopLink, { FooterNavigationReset } from "./FooterTopLink";

const EMAIL = "gedu.shop@gmail.com";

export default function Footer({ categories }: { categories: StoreCategory[] }) {
  const topCategories = categories.slice(0, 6);

  return (
    <footer className="site-chrome relative mt-14 overflow-hidden bg-gradient-to-br from-plum-900 via-plum-800 to-plum-700 pb-28 text-white md:pb-10">
      <Suspense fallback={null}>
        <FooterNavigationReset />
      </Suspense>
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-96 rounded-full bg-coral-400/15 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-40 left-1/4 size-96 rounded-full bg-plum-400/15 blur-3xl" />
      <div className="mx-auto grid max-w-[120rem] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <FooterTopLink href="/" aria-label="GeduShop home" className="inline-flex rounded-2xl bg-white px-3 py-2 shadow-lg shadow-black/10">
            <Image src="/logo-light.png" alt="GeduShop" width={120} height={44} className="h-10 w-auto" />
          </FooterTopLink>
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-white/60">
            Baby items, toys and kids essentials — safe, fun and fairly priced. Cash on delivery all over
            Bangladesh.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li><FooterTopLink href="/shop" className="transition-colors hover:text-coral-300">All products</FooterTopLink></li>
            <li><FooterTopLink href="/shop?sale=1" className="transition-colors hover:text-coral-300">Flash sales</FooterTopLink></li>
            <li><FooterTopLink href="/shop?sort=date" className="transition-colors hover:text-coral-300">New arrivals</FooterTopLink></li>
            <li><FooterTopLink href="/my-orders" className="transition-colors hover:text-coral-300">My orders</FooterTopLink></li>
            <li><FooterTopLink href="/track" className="transition-colors hover:text-coral-300">Track order</FooterTopLink></li>
            <li><FooterTopLink href="/faq" className="transition-colors hover:text-coral-300">FAQ &amp; Help</FooterTopLink></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            {topCategories.map((c) => (
              <li key={c.id}>
                <FooterTopLink href={`/category/${c.slug}`} className="transition-colors hover:text-coral-300">
                  {c.name}
                </FooterTopLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + company */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Get in touch</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>
              <a href={`tel:${PHONE}`} className="flex items-center gap-2 hover:text-coral-300">
                <Phone className="size-4 text-coral-300" strokeWidth={2.25} /> {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-coral-300">
                <MessageCircle className="size-4 text-coral-300" strokeWidth={2.25} /> WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 hover:text-coral-300">
                <Mail className="size-4 text-coral-300" strokeWidth={2.25} /> {EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-coral-300" strokeWidth={2.25} /> Bangladesh — nationwide
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[120rem] flex-col items-center justify-between gap-3 px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] text-xs text-white/40 sm:flex-row md:pb-5 md:pr-24 lg:pl-8">
          <p>© {new Date().getFullYear()} GeduShop. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 [&_button]:hover:text-coral-300">
            <FooterTopLink href="/privacy" className="hover:text-coral-300">Privacy</FooterTopLink>
            <FooterTopLink href="/terms" className="hover:text-coral-300">Terms</FooterTopLink>
            <FooterTopLink href="/return-policy" className="hover:text-coral-300">Returns</FooterTopLink>
            <FooterTopLink href="/delivery" className="hover:text-coral-300">Delivery</FooterTopLink>
            <CookieSettingsButton />
            <FooterTopLink href="/about" className="hover:text-coral-300">About</FooterTopLink>
            <FooterTopLink href="/contact" className="hover:text-coral-300">Contact</FooterTopLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}
