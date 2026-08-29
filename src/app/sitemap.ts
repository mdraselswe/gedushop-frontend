import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/wp";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Unguarded: a swallowed failure here publishes a sitemap listing only the
  // static pages, telling search engines every product and category URL is
  // gone. That is silent — nothing in the build output would say so — and it
  // is the worst outcome of the three. Better to fail the deploy.
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/combos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/track`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/delivery`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/return-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
    images: p.images?.[0]?.src ? [p.images[0].src] : undefined,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
