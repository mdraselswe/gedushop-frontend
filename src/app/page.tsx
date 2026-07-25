import BannerSlider from "@/components/BannerSlider";
import ProductGrid from "@/components/ProductGrid";
import TrustBar from "@/components/TrustBar";
import { getProducts } from "@/lib/wp";

export default async function HomePage() {
  const products = await getProducts({ perPage: 20 }).catch(() => []);

  return (
    <div className="space-y-6 px-4 pb-4 pt-4">
      <BannerSlider />
      <TrustBar />
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-plum-800 md:text-2xl">
              Popular right now
            </h2>
            <p className="text-sm text-plum-400">Loved by parents this week</p>
          </div>
          <a href="/shop" className="shrink-0 text-sm font-bold text-coral-500 hover:text-coral-600">
            See all →
          </a>
        </div>
        <ProductGrid products={products} reveal />
      </section>
    </div>
  );
}
