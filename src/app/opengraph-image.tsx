import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "GeduShop — Baby Items & Toys in Bangladesh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f4274 0%, #6b5ca8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 800, letterSpacing: -2 }}>
          <span>Gedu</span>
          <span style={{ color: "#ee8881" }}>Shop</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 34, opacity: 0.9 }}>
          Baby Items, Toys & Kids Essentials
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 26,
            fontWeight: 700,
            background: "#ee8881",
            padding: "14px 36px",
            borderRadius: 999,
          }}
        >
          Cash on Delivery · All over Bangladesh
        </div>
      </div>
    ),
    size,
  );
}
