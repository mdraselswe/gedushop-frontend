import type { Metadata } from "next";
import { PackageCheck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CombosGrid from "@/components/CombosGrid";
import { getCombos, comboSaving } from "@/lib/wp";

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
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
      {sorted.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
        />
      )}
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Combo offers" }]} />

      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-plum-800">
          <PackageCheck className="size-6 text-coral-500" strokeWidth={2.25} />
          Combo offers
        </h1>
        <p className="mt-1 text-sm text-plum-500">
          Products bundled into a set at one price — always less than buying them one by one.
        </p>
      </div>

      <CombosGrid initial={sorted} />
    </div>
  );
}
