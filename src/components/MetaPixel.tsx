import Script from "next/script";

/** Meta (Facebook) Pixel base code + PageView. Renders only when the pixel ID
 *  is set at build time. Standard events (ViewContent, AddToCart, etc.) are
 *  fired from components via lib/pixel.ts. */
export default function MetaPixel() {
  const id = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  if (!id) return null;
  return (
    <>
      {/* afterInteractive, not lazyOnload: lazyOnload waits for the window
          `load` event, which on a product page waits for every gallery image.
          Effects that fire on mount — ViewContent above all — ran long before
          fbq existed and were dropped. lib/pixel.ts queues anything that still
          slips through the remaining gap. */}
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
