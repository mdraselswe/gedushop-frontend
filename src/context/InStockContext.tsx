"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface InStockCtx {
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  ready: boolean;
}

const Ctx = createContext<InStockCtx | null>(null);
const KEY = "gedu_instock_only";

/** Global "In stock only" preference, persisted so it applies across every listing page. */
export function InStockProvider({ children }: { children: React.ReactNode }) {
  const [inStockOnly, setInStockOnlyState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInStockOnlyState(localStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  const setInStockOnly = (v: boolean) => {
    setInStockOnlyState(v);
    if (v) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  };

  return <Ctx.Provider value={{ inStockOnly, setInStockOnly, ready }}>{children}</Ctx.Provider>;
}

export function useInStock() {
  return useContext(Ctx) ?? { inStockOnly: false, setInStockOnly: () => {}, ready: false };
}
