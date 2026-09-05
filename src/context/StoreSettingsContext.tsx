"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, GEDU_API } from "@/lib/api";

export interface StoreSettings {
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryMinimum: number;
}

const DEFAULTS: StoreSettings = {
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  freeDeliveryMinimum: 1500,
};

const StoreSettingsContext = createContext<StoreSettings>(DEFAULTS);

function validNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    apiFetch(`${GEDU_API}/store-settings`, { cache: "no-store" }, 3)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") return;
        setSettings({
          insideDhakaCharge: validNumber(data.inside_dhaka_charge, DEFAULTS.insideDhakaCharge),
          outsideDhakaCharge: validNumber(data.outside_dhaka_charge, DEFAULTS.outsideDhakaCharge),
          freeDeliveryMinimum: validNumber(data.free_delivery_minimum, DEFAULTS.freeDeliveryMinimum),
        });
      })
      // Keep the last deployed, currently valid policy visible during a brief
      // WordPress outage; Woo remains authoritative when checkout reconnects.
      .catch(() => {});
  }, []);

  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}

export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
