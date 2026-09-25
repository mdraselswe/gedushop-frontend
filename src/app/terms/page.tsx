import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for ordering, pricing, delivery, returns and using the GeduShop website.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p className="text-xs font-semibold text-plum-400">Last updated: 26 September 2026</p>
      <p>By ordering from GeduShop you agree to the terms below.</p>

      <div>
        <h2>Orders</h2>
        <ul>
          <li>Placing an order is an offer to buy; we confirm it by phone before dispatch</li>
          <li>We may cancel an order if an item is out of stock or details can&apos;t be verified</li>
          <li>Payment options shown at checkout apply to that order</li>
          <li>You are responsible for giving accurate contact and delivery details</li>
        </ul>
      </div>

      <div>
        <h2>Payment</h2>
        <p>
          Cash on Delivery and, when enabled, bKash may be offered at checkout. A bKash order is accepted only after
          its transaction reference and payment are verified. Never send money to a number not displayed in the
          checkout payment instructions.
        </p>
      </div>

      <div>
        <h2>Delivery and failed delivery</h2>
        <p>
          Delivery estimates are not guarantees and may change because of courier, weather, holiday or address
          conditions. Delivery fees are shown before order submission. Repeatedly refusing confirmed orders may
          affect whether we can offer the same payment method on a later order.
        </p>
      </div>

      <div>
        <h2>Pricing</h2>
        <p>
          Prices are in Bangladeshi Taka and include applicable charges. Delivery charges are shown at checkout.
          We try to keep prices and product details accurate, but errors may occasionally occur.
        </p>
      </div>

      <div>
        <h2>Cancellation</h2>
        <p>You can request cancellation before dispatch by contacting us on WhatsApp or phone. Once handed to the courier, cancellation may no longer be possible.</p>
      </div>

      <div>
        <h2>Returns and refunds</h2>
        <p>Eligibility, evidence, return shipping and refund handling follow our Return &amp; Refund Policy, which forms part of these terms.</p>
      </div>

      <div>
        <h2>Product information and promotions</h2>
        <p>
          Colours can vary by screen and packaging may be updated by a manufacturer. Age, material and usage notes
          should be reviewed before use. Coupons, free delivery and promotional prices may have eligibility, stock
          or time limits and cannot be exchanged for cash.
        </p>
      </div>

      <div>
        <h2>Website use</h2>
        <p>
          Do not attempt to disrupt the site, automate abusive requests, access another customer&apos;s order or submit
          false information. To the extent allowed by law, GeduShop is not responsible for indirect loss or for a
          delay outside our reasonable control. Nothing here removes rights that applicable law gives a customer.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>For questions, complaints or a copy of the terms applying to an order, reach us at gedu.shop@gmail.com. We may update these terms for future orders; the date above shows the latest version.</p>
      </div>
    </LegalPage>
  );
}
