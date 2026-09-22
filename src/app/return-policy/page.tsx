import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Read GeduShop's claim evidence, return eligibility, request process, replacement and refund policy for orders in Bangladesh.",
  alternates: { canonical: "/return-policy/" },
};

export default function ReturnPolicyPage() {
  return (
    <LegalPage title="Return & Refund Policy">
      <p>
        We carefully check and pack every order. If there is a genuine problem with your delivery, we&apos;ll review
        your claim and help with a suitable solution.
      </p>

      <div>
        <h2>Problems you can claim for</h2>
        <ul>
          <li>A product shown in your order is missing from the parcel</li>
          <li>You received fewer items than the quantity you ordered</li>
          <li>You received the wrong product, size, colour or variation</li>
          <li>The product arrived broken, damaged, defective or not working</li>
          <li>The product is significantly different from its description</li>
        </ul>
      </div>

      <div>
        <h2>Video proof is required for every claim</h2>
        <p>
          To help us verify what happened, you must provide a complete, clear and continuous unboxing video for any
          claim. Start recording before opening the parcel and do not pause, cut or edit the video.
        </p>
        <ul>
          <li>Show the parcel&apos;s shipping label and all sides of the sealed package</li>
          <li>Record the full opening of the parcel in one continuous shot</li>
          <li>Show every item received and count the quantities clearly</li>
          <li>Clearly show any wrong, missing, damaged, broken or defective product</li>
          <li>If relevant, record the product&apos;s first test or use so the fault can be seen</li>
        </ul>
        <p>
          Photos or a video recorded after the parcel has already been opened are not sufficient on their own. We
          may be unable to approve a claim if the complete unboxing video is missing, unclear, paused or edited.
        </p>
      </div>

      <div>
        <h2>How to submit a claim</h2>
        <p>
          Contact us within 3 days of delivery on WhatsApp or by phone. Send your order number, a short description
          of the problem and the complete video proof. Keep the product unused, with all accessories, tags, free
          gifts and original packaging, until we finish reviewing your claim.
        </p>
      </div>

      <div>
        <h2>Verification and resolution</h2>
        <p>
          We&apos;ll review the video, order details and the returned product where necessary. Once the claim is
          verified, we may replace the affected product, send the missing quantity or issue a refund, depending on
          the problem and product availability.
        </p>
      </div>

      <div>
        <h2>Refunds</h2>
        <p>
          Approved refunds are sent via bKash or Nagad after any required return is received and checked. Refunds
          are normally processed within 3–7 working days.
        </p>
      </div>

      <div>
        <h2>Not eligible</h2>
        <ul>
          <li>Claims without complete, clear and continuous video proof</li>
          <li>Used, washed, altered or customer-damaged items</li>
          <li>Items returned without their original packaging, accessories, tags or free gifts</li>
          <li>Requests made after 3 days of delivery</li>
          <li>Change-of-mind requests where the correct, undamaged product was delivered</li>
        </ul>
      </div>
    </LegalPage>
  );
}
