import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GeduShop — Baby Items & Toys",
    short_name: "GeduShop",
    description: "Baby items, toys and kids essentials in Bangladesh. Cash on delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6fb",
    theme_color: "#4f4274",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
