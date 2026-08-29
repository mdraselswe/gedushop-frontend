"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductGallery from "@/components/ProductGallery";
import ComboContents from "@/components/ComboContents";
import ProductAssurance from "@/components/ProductAssurance";
import Highlights from "@/components/Highlights";
import { apiFetch, STORE_API } from "@/lib/api";
import { discountPercent } from "@/lib/format";
import type { StoreProduct } from "@/lib/types";

/**
 * A product page for a product this build has never heard of.
 *
 * The storefront is a static export: every product page is an HTML file written
 * at build time, and listing pages fetch live. So the minute a product is
 * published in WooCommerce it appears in /shop — and clicking it lands on a
 * 404, because its file does not exist yet. The rebuild fixes that a few
 * minutes later. This covers the few minutes.
 *
 * It renders from the Store API in the browser, which is where the buy box gets
 * its live price and stock anyway. Less than the built page — no reviews, no
 * related products, no server-rendered SEO — but it sells, and that is the
 * whole point of the window it exists to cover.
 *
 * Once the rebuild lands, the real page takes over and this is never reached.
 */
export default function ProductFallback({ onMiss }: { onMiss: () => void }) {
  const [product, setProduct] = useState<StoreProduct | null>(null);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/product\/([^/]+)\/?$/);
    if (!match) {
      onMiss();
      return;
    }
    const slug = decodeURIComponent(match[1]);
    apiFetch(`${STORE_API}/products?slug=${encodeURIComponent(slug)}&per_page=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: StoreProduct[]) => {
        if (list.length > 0) {
          setProduct(list[0]);
          document.title = `${list[0].name} — Price in Bangladesh | GeduShop`;
        } else {
          // Genuinely not a product. Hand back to the ordinary 404.
          onMiss();
        }
      })
      .catch(onMiss);
  }, [onMiss]);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-plum-300" />
      </div>
    );
  }

  const combo = product.extensions?.gedushop?.combo;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]}
      />

      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          discount={discountPercent(product.prices)}
          slug={product.slug}
          video={product.extensions?.gedushop?.video}
        />

        <div className="space-y-4">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-plum-800 md:text-2xl">
            {product.name}
          </h1>

          <ProductBuyBox product={product} />

          <ProductAssurance />

          <Highlights html={product.short_description} />
        </div>
      </div>

      {combo && <ComboContents combo={combo} prices={product.prices} />}

      {product.description && (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">
            Details
          </h2>
          <div
            className="prose prose-sm mt-3 max-w-none text-plum-600"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      <p className="mt-8 text-center text-xs text-plum-400">
        Just added to the shop.{" "}
        <Link href="/shop" className="underline">
          Browse everything else
        </Link>
      </p>
    </div>
  );
}
