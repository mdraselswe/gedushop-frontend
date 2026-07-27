"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CircleCheckBig, MapPin, Phone } from "lucide-react";
import { fbTrack } from "@/lib/pixel";

interface OrderSnapshot {
  id: number | string;
  items: { name: string; qty: number; total: string }[];
  subtotal: string;
  discount: string | null;
  delivery: string;
  fee: string | null;
  total: string;
  method: string;
  trxId: string | null;
  name: string;
  phone: string;
  address: string;
}

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  const value = params.get("value");
  const tracked = useRef(false);
  const [snap, setSnap] = useState<OrderSnapshot | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gedu_last_order");
      if (raw) {
        const parsed: OrderSnapshot = JSON.parse(raw);
        if (String(parsed.id) === String(order)) setSnap(parsed);
      }
    } catch {
      // no snapshot — simple view
    }
  }, [order]);

  useEffect(() => {
    if (tracked.current || !order) return;
    tracked.current = true;
    fbTrack("Purchase", {
      currency: "BDT",
      value: value ? Number(value) : 0,
      content_type: "product",
      order_id: order,
    });
  }, [order, value]);

  const isBkash = snap?.method === "bKash";

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-10">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-emerald-50">
          <CircleCheckBig className="size-10 text-emerald-500" strokeWidth={2} />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-plum-800">Order confirmed!</h1>
        {order && (
          <p className="mt-2 rounded-full bg-plum-50 px-4 py-1.5 text-sm font-extrabold text-plum-600">
            Order #{order}
          </p>
        )}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-plum-500">
          {isBkash
            ? "We received your order and will verify your bKash payment, then call you to confirm delivery."
            : "We'll call you shortly to confirm delivery. Keep the cash ready — pay only when your order arrives."}
        </p>
      </div>

      {snap && (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <h2 className="font-heading text-base font-semibold text-plum-800">Order details</h2>

          <ul className="mt-3 space-y-2 border-b border-plum-100 pb-3 text-sm text-plum-600">
            {snap.items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <span className="leading-snug">
                  {it.name} <span className="whitespace-nowrap text-plum-400">× {it.qty}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">{it.total}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1 text-sm text-plum-500">
            <Row label="Subtotal" value={snap.subtotal} />
            {snap.discount && <Row label="Discount" value={`−${snap.discount}`} accent="text-emerald-600" />}
            <Row label="Delivery" value={snap.delivery} />
            {snap.fee && <Row label="bKash charge" value={snap.fee} />}
          </div>
          <div className="mt-2 flex justify-between border-t border-plum-100 pt-2.5 text-base font-extrabold text-plum-800">
            <span>Total</span>
            <span className="tabular-nums">{snap.total}</span>
          </div>

          <div className="mt-4 space-y-1.5 rounded-2xl bg-plum-50/60 p-3.5 text-sm text-plum-700">
            <p className="font-bold">
              {snap.method}
              {snap.trxId && <span className="font-normal text-plum-500"> · TrxID {snap.trxId}</span>}
            </p>
            <p className="flex items-start gap-1.5 text-plum-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-coral-500" strokeWidth={2.25} />
              {snap.name} — {snap.address}
            </p>
            <p className="flex items-center gap-1.5 text-plum-600">
              <Phone className="size-4 shrink-0 text-coral-500" strokeWidth={2.25} />
              {snap.phone}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-coral-500 px-8 py-3 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
        >
          Continue Shopping
        </Link>
        {order && (
          <Link
            href={`/track?order=${order}`}
            className="rounded-full border border-plum-200 px-8 py-3 text-sm font-extrabold text-plum-600 hover:bg-plum-50"
          >
            Track Order
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`flex justify-between ${accent ?? ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
