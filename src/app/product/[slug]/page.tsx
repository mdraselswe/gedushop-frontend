import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductAssurance from "@/components/ProductAssurance";
import Highlights from "@/components/Highlights";
import StickyBuyBar from "@/components/StickyBuyBar";
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
  const minor = product.prices.currency_minor_unit ?? 2;
  const priceNum = Math.round(Number(product.prices.price) / 10 ** minor);
  const snippet = product.short_description.replace(/<[^>]+>/g, "").trim();
  const description = (
    (snippet ? snippet.slice(0, 110).trim() + " — " : "") +
    `Buy ${product.name} online in Bangladesh at ৳${priceNum}. Cash on delivery, genuine & quality-checked.`
  ).slice(0, 180);
  const title = `${product.name} — Price in Bangladesh`;
  const image = product.images[0]?.src;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
        <ProductGallery
          images={product.images}
          name={product.name}
          discount={discount}
          slug={product.slug}
          video={product.extensions?.gedushop?.video}
        />

        <div className="flex min-w-0 flex-col">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-plum-800 md:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {product.review_count > 0 ? (
              <a href="#reviews" className="flex items-center gap-1.5">
                <Stars value={Number(product.average_rating) || 0} className="size-4" />
                <span className="text-sm font-bold text-plum-500">
                  {Number(product.average_rating).toFixed(1)} ({product.review_count})
                </span>
              </a>
            ) : (
              <a href="#reviews" className="text-sm font-bold text-plum-400 hover:text-coral-500">
                Be the first to review
              </a>
            )}
            {product.categories[0] && (
              <>
                <span className="text-plum-200">·</span>
                <Link
                  href={`/category/${product.categories[0].slug}`}
                  className="text-sm font-bold text-plum-400 hover:text-coral-500"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span className="text-plum-200">·</span>
            <span className="text-xs font-semibold text-plum-300">SKU GS-{product.id}</span>
          </div>

          <ProductBuyBox product={product} />

          <ProductAssurance />

          <Highlights html={product.short_description} />
        </div>
      </div>

      {product.description && (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">Details</h2>
          <div
            className="mt-3 overflow-x-auto text-sm leading-relaxed text-plum-600 [&_a]:font-bold [&_a]:text-coral-500 [&_h1]:mt-4 [&_h1]:font-heading [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-plum-800 [&_h2]:mt-4 [&_h2]:font-heading [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-plum-800 [&_h3]:mt-4 [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-plum-800 [&_img]:hidden [&_li]:my-1 [&_p]:my-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-xl [&_pre]:bg-plum-50 [&_pre]:p-3 [&_pre]:font-body [&_pre]:text-sm [&_strong]:text-plum-800 [&_table]:my-3 [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_td]:border [&_td]:border-plum-100 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:break-words [&_th]:border [&_th]:border-plum-100 [&_th]:bg-plum-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:text-plum-800 [&_th]:break-words [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
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
          <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-plum-800">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} />

      <StickyBuyBar product={product} />
    </div>
  );
}
