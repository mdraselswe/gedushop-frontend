import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Return & Refund Policy" };

export default function ReturnPolicyPage() {
  return (
    <LegalPage title="Return & Refund Policy">
      <p>We want you to be happy with every order. If something isn&apos;t right, we&apos;ll make it right.</p>

      <div>
        <h2>When you can return</h2>
        <ul>
          <li>The item arrived damaged or defective</li>
          <li>You received the wrong product</li>
          <li>The item is significantly different from its description</li>
        </ul>
      </div>

      <div>
        <h2>How to request</h2>
        <p>
          Contact us within 3 days of delivery on WhatsApp or by phone with your order number and a photo of the
          issue. Keep the product unused and in its original packaging.
        </p>
      </div>

      <div>
        <h2>Refunds</h2>
        <p>
          Once we receive and check the returned item, we&apos;ll refund you via bKash/Nagad or replace the product —
          whichever you prefer. Refunds are processed within 3–7 working days.
        </p>
      </div>

      <div>
        <h2>Not eligible</h2>
        <ul>
          <li>Used or washed items</li>
          <li>Items without original packaging</li>
          <li>Requests made after 3 days of delivery</li>
        </ul>
      </div>
    </LegalPage>
  );
}
