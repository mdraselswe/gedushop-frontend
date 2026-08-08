import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans_Bengali, Nunito } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { InStockProvider } from "@/context/InStockContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MessengerButton from "@/components/MessengerButton";
import SiteJsonLd from "@/components/SiteJsonLd";
import Analytics from "@/components/Analytics";
import MetaPixel from "@/components/MetaPixel";
import BottomNav from "@/components/BottomNav";
import CartDockButton from "@/components/CartDockButton";
import CartDrawer from "@/components/CartDrawer";
import Sidebar from "@/components/Sidebar";
import { getCategories } from "@/lib/wp";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Bangla glyph fallback — Nunito/Fredoka have no Bengali, so without this the
// browser falls back to inconsistent system fonts for বাংলা content.
const bengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com"),
  title: {
    default: "GeduShop — Baby Items & Toys in Bangladesh",
    template: "%s | GeduShop",
  },
  description:
    "GeduShop — baby items, toys and kids essentials in Bangladesh. Order online, cash on delivery.",
  verification: { google: "Fp6pGFx8e9THBB-oayAFFv1VaNbZMpT0qWSY_JQ8Nxk" },
  openGraph: {
    type: "website",
    siteName: "GeduShop",
    title: "GeduShop — Baby Items & Toys in Bangladesh",
    description: "Baby items, toys and kids essentials. Cash on delivery all over Bangladesh.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "GeduShop — Baby Items, Toys & Kids Essentials" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeduShop — Baby Items & Toys in Bangladesh",
    description: "Baby items, toys and kids essentials. Cash on delivery all over Bangladesh.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "GeduShop",
    statusBarStyle: "default",
  },
  // Favicons come from the file-convention: src/app/{favicon.ico,icon.png,apple-icon.png}
};

export const viewport: Viewport = {
  themeColor: "#4f4274",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Unguarded: this feeds the nav on every page, so swallowing a failure ships
  // the whole site with an empty menu and no warning.
  const categories = await getCategories();

  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} ${bengali.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla etc.) inject
          attributes into <body> before React hydrates — harmless, not our markup */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Shown only on browsers too old to render the site's CSS (see .browser-warning) */}
        <div className="browser-warning">
          ⚠️ Your browser is outdated and this site may look broken. Please use an updated
          browser like <strong>Chrome</strong>. — আপনার ব্রাউজারটি পুরনো, সাইটটি ঠিকমতো দেখতে{" "}
          <strong>Chrome</strong> ব্যবহার করুন।
        </div>
        <SiteJsonLd />
        <Analytics />
        <MetaPixel />
        <ToastProvider>
        <WishlistProvider>
        <InStockProvider>
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <div className="mx-auto flex w-full max-w-[120rem] flex-1">
            <Sidebar categories={categories} />
            <main className="min-w-0 flex-1 overflow-x-clip pb-8">{children}</main>
          </div>
          <Footer categories={categories} />
          <CartDockButton />
          <CartDrawer />
          <BottomNav categories={categories} />
          <ScrollToTop />
          <MessengerButton />
        </CartProvider>
        </InStockProvider>
        </WishlistProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
