import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
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
  const categories = await getCategories().catch(() => []);

  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla etc.) inject
          attributes into <body> before React hydrates — harmless, not our markup */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
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
