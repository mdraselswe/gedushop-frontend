import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import { getAllProducts, getCategories, getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";

const PER_PAGE = 24;

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return Array.from({ length: Math.max(0, Math.ceil(products.length / PER_PAGE) - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = Number((await params).page);
  return {
    title: `Shop Baby Products & Kids Toys — Page ${page}`,
    description: `Browse page ${page} of baby products, kids toys and family essentials available from GeduShop with cash on delivery across Bangladesh.`,
    alternates: { canonical: `/shop/page/${page}/` },
  };
}

export default async function PagedShopPage({ params }: Props) {
  const page = Number((await params).page);
  if (!Number.isInteger(page) || page < 2) notFound();

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProductsPaged({ perPage: PER_PAGE, page, orderby: "popularity" }),
    getCategories(),
  ]);
  if (page > totalPages || products.length === 0) notFound();

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">
        Shop Baby Products & Kids Toys — Page {page}
      </h1>
      <ProductBrowser
        categories={categories}
        initialProducts={productCardPayloads(products)}
        initialTotal={total}
        initialPage={page}
        paginationBase="/shop"
      />
    </div>
  );
}
