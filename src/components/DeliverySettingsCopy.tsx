"use client";

import { formatTaka, useStoreSettings } from "@/context/StoreSettingsContext";

export function DeliveryChargesList() {
  const settings = useStoreSettings();
  return (
    <ul>
      <li>Inside Dhaka: {formatTaka(settings.insideDhakaCharge)}</li>
      <li>Outside Dhaka: {formatTaka(settings.outsideDhakaCharge)}</li>
      <li>Free delivery on orders of {formatTaka(settings.freeDeliveryMinimum)} or more</li>
    </ul>
  );
}

export function DeliveryFaqAnswer() {
  const settings = useStoreSettings();
  return (
    <>
      Inside Dhaka {formatTaka(settings.insideDhakaCharge)}, outside Dhaka{" "}
      {formatTaka(settings.outsideDhakaCharge)}. Orders of {formatTaka(settings.freeDeliveryMinimum)} or more get
      free delivery anywhere in Bangladesh.
    </>
  );
}

