import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>By ordering from GeduShop you agree to the terms below.</p>

      <div>
        <h2>Orders</h2>
        <ul>
          <li>Placing an order is an offer to buy; we confirm it by phone before dispatch</li>
          <li>We may cancel an order if an item is out of stock or details can&apos;t be verified</li>
          <li>All orders are cash on delivery unless stated otherwise</li>
        </ul>
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
        <p>You can cancel any order before it is dispatched by contacting us on WhatsApp or phone.</p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>For any question about these terms, reach us at gedu.shop@gmail.com.</p>
      </div>
    </LegalPage>
  );
}
