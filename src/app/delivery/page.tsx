import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Delivery" };

export default function DeliveryPage() {
  return (
    <LegalPage title="Delivery">
      <p>We deliver across Bangladesh with cash on delivery — pay only when your order reaches you.</p>

      <div>
        <h2>Delivery charges</h2>
        <ul>
          <li>Inside Dhaka: ৳80</li>
          <li>Outside Dhaka: ৳120</li>
          <li>Free delivery on orders over ৳2,000</li>
        </ul>
      </div>

      <div>
        <h2>Delivery time</h2>
        <ul>
          <li>Inside Dhaka: 1–2 working days</li>
          <li>Outside Dhaka: 3–5 working days</li>
        </ul>
        <p className="mt-2">We call to confirm every order before dispatch, so please keep your phone reachable.</p>
      </div>

      <div>
        <h2>Payment</h2>
        <p>All orders are cash on delivery. Please keep the exact amount ready when your order arrives.</p>
      </div>
    </LegalPage>
  );
}
