import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { DeliveryChargesList } from "@/components/DeliverySettingsCopy";

export const metadata: Metadata = {
  title: "Delivery Across Bangladesh",
  description: "GeduShop delivery charges, estimated times and cash-on-delivery information for Dhaka and the rest of Bangladesh.",
  alternates: { canonical: "/delivery/" },
};

export default function DeliveryPage() {
  return (
    <LegalPage title="Delivery">
      <p>We deliver across Bangladesh. Cash on Delivery is available, and another payment option may appear at checkout when enabled.</p>

      <div>
        <h2>Delivery charges</h2>
        <DeliveryChargesList />
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
        <p>For Cash on Delivery, please keep the exact amount ready. If you select bKash, follow only the number and instructions displayed at checkout and keep the transaction reference.</p>
      </div>

      <div>
        <h2>Delays and address changes</h2>
        <p>Times are estimates and can be affected by holidays, weather, courier coverage or an unreachable phone. Contact us before dispatch if an address needs to change; a change after dispatch may not be possible.</p>
      </div>
    </LegalPage>
  );
}
