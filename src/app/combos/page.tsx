import type { Metadata } from "next";
import { PackageCheck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CombosGrid from "@/components/CombosGrid";
import { getCombos, comboSaving } from "@/lib/wp";
import { serializeJsonLd } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "Combo Offers — Buy Sets & Save",
  description:
    "GeduShop combo packs: buy products together as a set and pay less than buying them one by one. Cash on delivery across Bangladesh.",
  alternates: { canonical: "/combos/" },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

export default async function CombosPage() {
  // Unguarded, like the other listing pages: a combos page that silently built
  // empty would look exactly like a shop that runs no offers.
  const combos = await getCombos();

  // Biggest saving first — the reason anyone opens this page.
  const sorted = [...combos].sort((a, b) => comboSaving(b) - comboSaving(a));

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GeduShop combo offers",
    itemListElement: sorted.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/product/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <div className="w-full space-y-4 px-4 pt-4">
      {sorted.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(listLd) }}
        />
      )}
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Combo offers" }]} />

      <div className="grain relative overflow-hidden rounded-2xl bg-gradient-to-r from-plum-700 via-plum-600 to-coral-500 p-6 text-white">
        <span aria-hidden className="absolute -right-12 -top-20 size-52 rounded-full bg-white/12 blur-2xl" />
        <h1 className="relative flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><PackageCheck className="size-6" strokeWidth={2.25} /></span>
          Combo offers
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm text-white/75">
          Products bundled into a set at one price — always less than buying them one by one.
        </p>
      </div>

      <CombosGrid initial={sorted} />
    </div>
  );
}
