import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site — hosted free on Cloudflare Pages. No Node server: all
  // dynamic data is fetched client-side from the WooCommerce Store API (CORS),
  // and product pages are prerendered at build via generateStaticParams.
  output: "export",
  images: {
    // Cloudflare Pages static hosting can't run the Next image optimizer.
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
