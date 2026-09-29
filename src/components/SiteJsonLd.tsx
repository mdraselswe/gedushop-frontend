import { PHONE } from "@/lib/contact";
import { serializeJsonLd } from "@/lib/jsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

/** Sitewide Organization + WebSite structured data (helps brand knowledge panel
 *  and the Google sitelinks search box). */
export default function SiteJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "GeduShop",
      alternateName: ["গেদুশপ", "Gedu Shop", "GeduShop BD", "GeduShop Bangladesh"],
      url: SITE,
      logo: `${SITE}/icon.png`,
      description:
        "বাচ্চাদের খেলনা (Baby Toys), বেবি ড্রেস (Baby Clothes) এবং শিশুর প্রয়োজনীয় সব প্রোডাক্টের বিশ্বস্ত অনলাইন শপ। Baby items, toys and kids essentials in Bangladesh. Cash on delivery.",
      email: "gedu.shop@gmail.com",
      telephone: PHONE,
      areaServed: "BD",
      knowsAbout: [
        "Baby Toys",
        "বাচ্চাদের খেলনা",
        "Kids Products",
        "Baby Clothing",
        "Educational Toys",
        "Babuder Khelna",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: PHONE,
        contactType: "customer service",
        areaServed: "BD",
        availableLanguage: ["Bangla", "English"],
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        merchantReturnLink: `${SITE}/return-policy/`,
      },
      sameAs: ["https://facebook.com/gedushop"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "GeduShop",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/shop/?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  );
}
