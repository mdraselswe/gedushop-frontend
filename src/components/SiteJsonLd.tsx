import { PHONE } from "@/lib/contact";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gedushop.com";

/** Sitewide Organization + WebSite structured data (helps brand knowledge panel
 *  and the Google sitelinks search box). */
export default function SiteJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "GeduShop",
      url: SITE,
      logo: `${SITE}/icon.png`,
      description: "Baby items, toys and kids essentials in Bangladesh. Cash on delivery.",
      email: "gedu.shop@gmail.com",
      telephone: PHONE,
      areaServed: "BD",
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
