import type { Metadata } from "next";
import { createElement } from "react";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { categoryIcon } from "@/lib/categoryIcons";
import { getCategories, getCategoryBySlug, getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";
const PER_PAGE = 24;

interface Props {
  params: Promise<{ slug: string; page: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.flatMap((category) =>
    Array.from({ length: Math.max(0, Math.ceil(category.count / PER_PAGE) - 1) }, (_, index) => ({
      slug: category.slug,
      page: String(index + 2),
    })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const [category, page] = [await getCategoryBySlug(slug), Number(rawPage)];
  if (!category) return { title: "Category not found", robots: { index: false } };
  return {
    title: `${category.name} in Bangladesh — Page ${page}`,
    description: `Browse page ${page} of ${category.name.toLowerCase()} available online from GeduShop with cash on delivery across Bangladesh.`,
    alternates: { canonical: `/category/${category.slug}/page/${page}/` },
    ...(category.slug === "uncategorized" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PagedCategoryPage({ params }: Props) {
  const { slug, page: rawPage } = await params;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 2) notFound();
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { products, total, totalPages } = await getProductsPaged({
    category: String(category.id),
    perPage: PER_PAGE,
    page,
  });
  if (page > totalPages || products.length === 0) notFound();

  const categoryIconElement = createElement(categoryIcon(category.slug), {
    className: "size-7 md:size-8",
    strokeWidth: 1.75,
  });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop/` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE}/category/${category.slug}/` },
      { "@type": "ListItem", position: 4, name: `Page ${page}`, item: `${SITE}/category/${category.slug}/page/${page}/` },
    ],
  };

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop/" },
        { label: category.name, href: `/category/${category.slug}/` },
        { label: `Page ${page}` },
      ]} />
      <div className="grain flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-plum-600 to-plum-500 p-5 text-white md:p-6">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 md:size-16">
          {categoryIconElement}
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {category.name} — Page {page}
          </h1>
          <p className="mt-1 text-sm opacity-90">More {category.name.toLowerCase()} available from GeduShop</p>
        </div>
      </div>
      <ProductBrowser
        categoryId={String(category.id)}
        initialProducts={productCardPayloads(products)}
        initialTotal={total}
        initialPage={page}
        paginationBase={`/category/${category.slug}`}
      />
    </div>
  );
}
