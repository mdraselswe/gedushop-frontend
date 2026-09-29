import type { Metadata } from "next";
import { createElement } from "react";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import CategorySeoContent from "@/components/CategorySeoContent";
import { categoryIcon } from "@/lib/categoryIcons";
import { decodeEntities } from "@/lib/decode";
import { getCategories, getCategoryBySlug, getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";
import { HOME_OG_IMAGE, SITE_URL } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/jsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = SITE_URL;

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

const CATEGORY_SEO: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  toys: {
    title: "বাচ্চাদের খেলনা — Kids & Baby Toys in Bangladesh",
    description:
      "বাংলাদেশে সেরা বাচ্চাদের খেলনা (Kids Toys) ও ছোট বাবুদের খেলনা (babuder khelna) কিনুন GeduShop-এ। শিক্ষামূলক খেলনা, ডল, কার ও পাজল ক্যাশ অন ডেলিভারিতে অর্ডার করুন।",
    keywords: [
      "বাচ্চাদের খেলনা",
      "babuder khelna",
      "baby toys",
      "kids toys bd",
      "toys bangladesh",
      "টয়স",
      "ছোটদের খেলনা",
      "educational toys",
    ],
  },
  "baby-clothing": {
    title: "বাচ্চাদের জামাকাপড় ও বেবি ড্রেস — Baby Clothing & Dresses in BD",
    description:
      "নবজাতক ও শিশুদের আরামদায়ক পোশাক ও জামাকাপড় (Baby Clothing) কিনুন সাশ্রয়ী দামে। Cotton baby dress, romper ও kids wear ক্যাশ অন ডেলিভারিতে অর্ডার করুন।",
    keywords: [
      "বাচ্চাদের জামাকাপড়",
      "বাচ্চাদের পোশাক",
      "বাচ্চাদের জামা",
      "baby cloth",
      "baby dress bd",
      "baby clothing bangladesh",
      "kids clothing",
    ],
  },
  education: {
    title: "বাচ্চাদের শিক্ষামূলক খেলনা — Educational Toys for Kids BD",
    description:
      "বাচ্চাদের মেধা বিকাশে সহায়ক শিক্ষামূলক খেলনা (Educational Toys) কিনুন GeduShop থেকে। টকিং বুক, রাইটিং প্যাড ও পাজল সাশ্রয়ী মূল্যে ক্যাশ অন ডেলিভারিতে।",
    keywords: [
      "শিক্ষামূলক খেলনা",
      "educational toys bd",
      "learning toys for kids",
      "বাচ্চাদের খেলনা",
      "babuder khelna",
    ],
  },
  "feeding-nursing": {
    title: "শিশুর ফিডিং ও নার্সিং সামগ্রী — Baby Feeding Essentials in BD",
    description:
      "শিশুর জন্য নিরাপদ ও বিপিএ-মুক্ত ফিডিং বোতল, সিলিকন বাটি ও নার্সিং সামগ্রী কিনুন সেরা দামে। সারা দেশে ক্যাশ অন ডেলিভারি।",
    keywords: ["ফিডিং বোতল", "baby feeding bd", "baby nursing", "সিলিকন বাটি", "baby care"],
  },
  "school-stationery-supplies": {
    title: "বাচ্চাদের স্কুল ও স্টেশনারি সামগ্রী — Kids School Stationery Sets BD",
    description:
      "কিউট কার্টুন স্টেশনারি সেট, জেল পেন ও স্কুল কিট কিনুন GeduShop থেকে। সাশ্রয়ী দাম ও দ্রুত হোম ডেলিভারি।",
    keywords: ["স্কুল স্টেশনারি", "school stationery bd", "kids stationery set", "কার্টুন পেন"],
  },
  "combo-offers": {
    title: "বাচ্চাদের খেলনা ও গিফট কম্বো অফার — Baby Gift & Toy Combos BD",
    description:
      "সাশ্রয়ী কম্বো অফারে বাচ্চাদের প্রিয় খেলনা ও উপহার সামগ্রী কিনুন। স্পেশাল ডিসকাউন্টে সারা দেশে ক্যাশ অন ডেলিভারি।",
    keywords: ["কম্বো অফার", "baby combo offers", "toy combos bd", "kids gift set"],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const n = category.name;
  const seo = CATEGORY_SEO[category.slug];
  const title = seo?.title ?? `${n} in Bangladesh — Buy ${n} Online at Best Price`;
  const description =
    seo?.description ??
    `Buy ${n.toLowerCase()} online in Bangladesh at GeduShop — ${category.count}+ genuine, quality-checked products. Cash on delivery all over the country at the best price.`;
  const keywords = seo?.keywords ?? [n, `${n} in bangladesh`, "GeduShop", "baby products bd"];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/category/${category.slug}/` },
    openGraph: { title, description, type: "website", images: [HOME_OG_IMAGE] },
    ...(category.slug === "uncategorized" ? { robots: { index: false, follow: true } } : {}),
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
  const categoryIconElement = createElement(categoryIcon(category.slug), {
    className: "size-7 md:size-8",
    strokeWidth: 1.75,
  });
  const categoryDescription = decodeEntities((category.description ?? "").replace(/<[^>]+>/g, "")).trim();

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name }]}
      />
      <div className="grain relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-plum-700 via-plum-600 to-coral-500 p-5 text-white md:p-7">
        <span aria-hidden className="absolute -right-12 -top-20 size-52 rounded-full bg-white/12 blur-2xl" />
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 md:size-16">
          {categoryIconElement}
        </span>
        <div className="relative min-w-0">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-sm opacity-90">
            {categoryDescription || "Cash on delivery all over Bangladesh"}
          </p>
        </div>
      </div>
      <ProductBrowser
        categoryId={String(category.id)}
        initialProducts={productCardPayloads(products)}
        initialTotal={total}
        paginationBase={`/category/${category.slug}`}
      />
      <CategorySeoContent slug={category.slug} />
    </div>
  );
}
