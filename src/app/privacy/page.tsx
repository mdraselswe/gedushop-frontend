import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GeduShop collects, uses and protects customer and order information.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="text-xs font-semibold text-plum-400">Last updated: 26 September 2026</p>
      <p>We collect only the information needed to run the shop, fulfil orders, prevent abuse and support customers. We do not sell or rent personal information.</p>

      <div>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, phone number and delivery address when you place an order</li>
          <li>Your email, only if you choose to provide it</li>
          <li>Order, payment-reference, cart and support-message details</li>
          <li>Device, browser, IP address and site-usage information</li>
        </ul>
      </div>

      <div>
        <h2>How we use it</h2>
        <ul>
          <li>To process, confirm and deliver your orders</li>
          <li>To contact you about your order</li>
          <li>To improve our products and service</li>
          <li>To remember your orders on your device and protect order lookup from misuse</li>
          <li>With your consent, to measure advertising and site performance</li>
        </ul>
      </div>

      <div>
        <h2>Sharing</h2>
        <p>
          We disclose only what is necessary to providers that operate the store, host or protect the website,
          process or verify a payment, provide customer support, and deliver an order. This can include
          WooCommerce/WordPress, our hosting and security provider, GeduSuite, couriers and the payment channel you
          select. Analytics or advertising providers receive data only according to your cookie choice.
        </p>
      </div>

      <div>
        <h2>Cookies and device storage</h2>
        <p>
          Essential browser storage keeps your cart, consent choice and order history working. Optional analytics
          and advertising tools are not loaded until you consent. You can change that choice from Cookie settings
          in the footer. Saved order history can be cleared through your browser&apos;s site-data controls.
        </p>
      </div>

      <div>
        <h2>Abandoned checkout</h2>
        <p>
          If you enter a valid phone number and cart details at checkout but do not finish, we may securely save a
          limited checkout snapshot so our team can offer order help. The endpoint is rate-limited and the snapshot
          is not used to place an order automatically.
        </p>
      </div>

      <div>
        <h2>Retention and security</h2>
        <p>
          We retain records only as long as reasonably needed for fulfilment, support, accounting, fraud prevention
          and legal obligations. We use access controls, encrypted transport and abuse controls, but no online
          service can promise absolute security.
        </p>
      </div>

      <div>
        <h2>Your choices</h2>
        <p>
          You may ask us to access, correct or delete personal information we control, subject to records we must
          retain. Include your order number and the phone used for the order so we can verify the request.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>Questions or privacy requests? Email gedu.shop@gmail.com or use the Contact page. We may update this policy when our services change.</p>
      </div>
    </LegalPage>
  );
}
