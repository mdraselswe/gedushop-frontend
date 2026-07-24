import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>We only collect what we need to deliver your order and support you. We never sell your information.</p>

      <div>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, phone number and delivery address when you place an order</li>
          <li>Your email, only if you choose to provide it</li>
          <li>Basic, anonymous usage data to keep the site working well</li>
        </ul>
      </div>

      <div>
        <h2>How we use it</h2>
        <ul>
          <li>To process, confirm and deliver your orders</li>
          <li>To contact you about your order</li>
          <li>To improve our products and service</li>
        </ul>
      </div>

      <div>
        <h2>Sharing</h2>
        <p>
          We share your delivery details only with our courier to complete delivery. We do not sell or rent your
          information to anyone.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>Questions about your data? Email us at gedu.shop@gmail.com and we&apos;ll help.</p>
      </div>
    </LegalPage>
  );
}
