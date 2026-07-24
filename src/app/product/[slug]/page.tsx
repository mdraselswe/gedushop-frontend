import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Truck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import Stars from "@/components/Stars";
import { discountPercent } from "@/lib/format";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/wp";

interface Props {
  params: Promise<{ slug: string }>;
}

// Prerender every product page at build time (static export). New products need
// a rebuild to appear — handled by the deploy script.
export async function generateStaticParams() {
  const products = await getProducts({ perPage: 100 }).catch(() => []);
  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description = product.short_description.replace(/<[^>]+>/g, "").slice(0, 160);
  const image = product.images[0]?.src;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categories[0]?.id, product.id).catch(() => []);
  const discount = discountPercent(product.prices);

  const minor = product.prices.currency_minor_unit ?? 2;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.src),
    description: product.short_description.replace(/<[^>]+>/g, "").slice(0, 300),
    sku: String(product.id),
    offers: {
      "@type": "Offer",
      url: `${SITE}/product/${product.slug}`,
      priceCurrency: product.prices.currency_code || "BDT",
      price: (Number(product.prices.price) / 10 ** minor).toFixed(2),
      availability: product.is_in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.review_count > 0 && Number(product.average_rating) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.average_rating).toFixed(1),
            reviewCount: product.review_count,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
      ...(product.categories[0]
        ? [{ "@type": "ListItem", position: 3, name: product.categories[0].name, item: `${SITE}/category/${product.categories[0].slug}` }]
        : []),
      { "@type": "ListItem", position: product.categories[0] ? 4 : 3, name: product.name, item: `${SITE}/product/${product.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(product.categories[0]
            ? [{ label: product.categories[0].name, href: `/category/${product.categories[0].slug}` }]
            : []),
          { label: product.name },
        ]}
      />
      <div className="grid gap-5 md:grid-cols-2 md:gap-8">
        <ProductGallery images={product.images} name={product.name} discount={discount} />

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-plum-800 md:text-3xl">
              {product.name}
            </h1>
            <div className="shrink-0 pt-1">
              <ShareButton title={product.name} />
            </div>
          </div>

          {product.review_count > 0 && (
            <a href="#reviews" className="mt-2.5 flex items-center gap-1.5">
              <Stars value={Number(product.average_rating) || 0} className="size-4" />
              <span className="text-sm font-bold text-plum-500">
                {Number(product.average_rating).toFixed(1)} ({product.review_count})
              </span>
            </a>
          )}

          <ProductBuyBox product={product} />

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-plum-600">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
              <Truck className="size-4 text-coral-500" strokeWidth={2.25} /> Cash on Delivery
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
              <BadgeCheck className="size-4 text-coral-500" strokeWidth={2.25} /> Quality checked
            </span>
          </div>

          {product.short_description && (
            <div
              className="prose-sm mt-6 max-w-[65ch] text-sm leading-relaxed text-plum-600 [&_img]:hidden"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">Details</h2>
          <div
            className="prose-sm mt-2 max-w-[70ch] text-sm leading-relaxed text-plum-600 [&_img]:hidden"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      <div id="reviews" className="scroll-mt-20">
        <ProductReviews
          productId={product.id}
          averageRating={Number(product.average_rating) || 0}
          reviewCount={product.review_count || 0}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-lg font-semibold text-plum-700">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
