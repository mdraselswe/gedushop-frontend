import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { StoreCategory } from "@/lib/types";

const PHONE = "+8801552958606";
const WHATSAPP = "8801552958606";
const EMAIL = "gedu.shop@gmail.com";

export default function Footer({ categories }: { categories: StoreCategory[] }) {
  const topCategories = categories.slice(0, 6);

  return (
    <footer className="mt-10 border-t border-plum-100/70 bg-white/70 pb-28 md:pb-10">
      <div className="mx-auto grid max-w-[120rem] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="GeduShop home">
            <Image src="/logo-light.png" alt="GeduShop" width={120} height={44} className="h-11 w-auto" />
          </Link>
          <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-plum-500">
            Baby items, toys and kids essentials — safe, fun and fairly priced. Cash on delivery all over
            Bangladesh.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-plum-800">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-plum-500">
            <li><Link href="/shop" className="hover:text-coral-500">All products</Link></li>
            <li><Link href="/shop?sale=1" className="hover:text-coral-500">Flash sales</Link></li>
            <li><Link href="/shop?sort=date" className="hover:text-coral-500">New arrivals</Link></li>
            <li><Link href="/track" className="hover:text-coral-500">Track order</Link></li>
            <li><Link href="/faq" className="hover:text-coral-500">FAQ &amp; Help</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-plum-800">Categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-plum-500">
            {topCategories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="hover:text-coral-500">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + company */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-plum-800">Get in touch</h3>
          <ul className="mt-3 space-y-2 text-sm text-plum-500">
            <li>
              <a href={`tel:${PHONE}`} className="flex items-center gap-2 hover:text-coral-500">
                <Phone className="size-4 text-coral-500" strokeWidth={2.25} /> +880 1552-958606
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-coral-500">
                <MessageCircle className="size-4 text-coral-500" strokeWidth={2.25} /> WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 hover:text-coral-500">
                <Mail className="size-4 text-coral-500" strokeWidth={2.25} /> {EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-coral-500" strokeWidth={2.25} /> Bangladesh — nationwide
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-plum-100/70">
        <div className="mx-auto flex max-w-[120rem] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-plum-400 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} GeduShop. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-coral-500">Privacy</Link>
            <Link href="/terms" className="hover:text-coral-500">Terms</Link>
            <Link href="/return-policy" className="hover:text-coral-500">Returns</Link>
            <Link href="/delivery" className="hover:text-coral-500">Delivery</Link>
            <Link href="/faq" className="hover:text-coral-500">FAQ</Link>
            <Link href="/about" className="hover:text-coral-500">About</Link>
            <Link href="/contact" className="hover:text-coral-500">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
