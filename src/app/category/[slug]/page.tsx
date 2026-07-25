import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/wp";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

// Prerender an SEO-friendly page per category (indexable HTML with products).
export async function generateStaticParams() {
  const cats = await getCategories().catch(() => []);
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

  const products = await getProducts({ category: String(category.id), perPage: 24 }).catch(() => []);

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
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">{category.name}</h1>
      <ProductBrowser
        categoryId={String(category.id)}
        initialProducts={products}
        initialTotal={category.count}
      />
    </div>
  );
}
