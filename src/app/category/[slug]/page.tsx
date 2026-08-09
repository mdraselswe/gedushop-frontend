import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { categoryIcon } from "@/lib/categoryIcons";
import { decodeEntities } from "@/lib/decode";
import { getCategories, getCategoryBySlug, getProductsPaged } from "@/lib/wp";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

// Prerender an SEO-friendly page per category (indexable HTML with products).
export async function generateStaticParams() {
  // Deliberately unguarded. getCategories already retries 8 times behind
  // fetchRetry, so anything reaching here is a real outage, not a blip — and
  // returning [] would hand Next an empty param list, which under
  // `output: export` it reports as "missing generateStaticParams()". That
  // message sent someone hunting for a deleted function twice.
  const cats = await getCategories();
  if (!cats.length) {
    throw new Error(
      "Store API returned no categories — refusing to build a site with no category pages",
    );
  }
  return cats.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const n = category.name;
  const title = `${n} in Bangladesh — Buy ${n} Online at Best Price`;
  const description = `Buy ${n.toLowerCase()} online in Bangladesh at GeduShop — ${category.count}+ genuine, quality-checked products. Cash on delivery all over the country at the best price.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  // Unguarded: an empty category page is indistinguishable from a genuinely
  // empty category, so a swallowed failure would publish a dead page.
  //
  // Paged, so the total comes from the same query that produced these rows.
  // Seeding it from the category's own term count meant Education's stale 1
  // became `totalPages: 1`, and the other six products had no page to be on
  // until something else triggered a refetch.
  const { products, total } = await getProductsPaged({
    category: String(category.id),
    perPage: 24,
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE}/category/${category.slug}` },
    ],
  };

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name }]}
      />
      {(() => {
        const Icon = categoryIcon(category.slug);
        const desc = decodeEntities((category.description ?? "").replace(/<[^>]+>/g, "")).trim();
        return (
          <div className="grain flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-plum-600 to-plum-500 p-5 text-white md:p-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 md:size-16">
              <Icon className="size-7 md:size-8" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                {category.name}
              </h1>
              <p className="mt-1 text-sm opacity-90">
                {desc || `${category.count} products · Cash on delivery all over Bangladesh`}
              </p>
            </div>
          </div>
        );
      })()}
      <ProductBrowser
        categoryId={String(category.id)}
        initialProducts={products}
        initialTotal={total}
      />
    </div>
  );
}
