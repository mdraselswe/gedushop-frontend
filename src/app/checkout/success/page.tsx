"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentType, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheckBig, Clock3, Home, MapPin, PackageCheck, Phone, ReceiptText, Sparkles, Truck } from "lucide-react";
import { fbSetUserData, fbTrack } from "@/lib/pixel";
import { addOrder, hasOrder } from "@/lib/orderHistory";
import OrderConfetti from "@/components/OrderConfetti";

interface OrderSnapshot {
  id: number | string;
  accessToken?: string;
  items: {
    /** Parent product id — matches ViewContent/AddToCart content_ids and the catalogue feed's g:id. */
    productId?: number;
    name: string;
    qty: number;
    total: string;
    /** Unit price in taka. */
    unitPrice?: number;
  }[];
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

/**
 * Order ids whose Purchase has already been reported.
 *
 * The in-component ref only survives one mount, so a refresh of the success
 * page — or reopening it from history — used to send Purchase again. Over
 * Aug 1-8 that produced 46 Purchase events against 17 real orders.
 * localStorage, not sessionStorage: the duplicate arrives in a fresh tab just
 * as easily as in this one.
 */
const TRACKED_KEY = "gedu_purchase_tracked";
const TRACKED_KEEP = 20;

function readTracked(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TRACKED_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function markTracked(order: string) {
  try {
    const next = [order, ...readTracked().filter((o) => o !== order)].slice(0, TRACKED_KEEP);
    localStorage.setItem(TRACKED_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — the eventID still lets Meta dedupe its side
  }
}

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  const value = params.get("value");
  const tracked = useRef(false);
  const [snap, setSnap] = useState<OrderSnapshot | null>(null);
  /**
   * Whether the snapshot lookup has finished — found or definitively absent.
   * Purchase waits for this so it can carry content_ids; without them Meta has
   * no idea *which* products were bought, which breaks catalogue attribution
   * and leaves dynamic retargeting with nothing to exclude or re-show.
   */
  const [snapReady, setSnapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let nextSnap: OrderSnapshot | null = null;
    try {
      const raw = sessionStorage.getItem("gedu_last_order");
      if (raw) {
        const parsed: OrderSnapshot = JSON.parse(raw);
        if (String(parsed.id) === String(order)) {
          nextSnap = parsed;
          if (!hasOrder(parsed.id)) {
            addOrder({
              id: parsed.id,
              ...(parsed.accessToken ? { accessToken: parsed.accessToken } : { phone: parsed.phone }),
              date: new Date().toISOString(),
              total: parsed.total,
              summary: parsed.items.map((i) => `${i.name} × ${i.qty}`).join(", "),
            });
          }
        }
      }
    } catch {
      // no snapshot — simple view
    }
    queueMicrotask(() => {
      if (cancelled) return;
      if (nextSnap) setSnap(nextSnap);
      setSnapReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [order]);

  useEffect(() => {
    if (tracked.current || !order || !snapReady) return;
    tracked.current = true;
    if (readTracked().includes(order)) return; // already reported on an earlier visit
    // Older snapshots (written before productId existed) and the
    // storage-unavailable path both land here with nothing to report — send the
    // event anyway rather than losing the conversion entirely.
    const lines = (snap?.items ?? []).filter((i) => typeof i.productId === "number");
    // Before the event, not after: advanced matching only applies to what the
    // pixel sends once the identifiers are set.
    if (snap) fbSetUserData({ name: snap.name, phone: snap.phone });
    fbTrack(
      "Purchase",
      {
        currency: "BDT",
        value: value ? Number(value) : 0,
        content_type: "product",
        order_id: order,
        ...(lines.length
          ? {
              content_ids: lines.map((i) => i.productId),
              contents: lines.map((i) => ({
                id: i.productId,
                quantity: i.qty,
                ...(typeof i.unitPrice === "number" ? { item_price: i.unitPrice } : {}),
              })),
              num_items: lines.reduce((n, i) => n + i.qty, 0),
            }
          : {}),
      },
      // Derived from the order rather than random, so that anything added
      // server-side later can agree on the value: Meta only collapses a pair
      // when both sides send the identical string.
      `purchase_${order}`,
    );
    markTracked(order);
  }, [order, value, snap, snapReady]);

  const isBkash = snap?.method === "bKash";

  return (
    <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-8 sm:pt-12">
      <OrderConfetti />

      <div className="overflow-hidden rounded-[2rem] bg-white shadow-[var(--shadow-lift)] ring-1 ring-plum-100/70">
        <div className="relative bg-gradient-to-br from-emerald-50 via-white to-coral-50 px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
          <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <Sparkles className="size-3.5" strokeWidth={2.5} />
            Success
          </div>
          <span className="mx-auto flex size-24 items-center justify-center rounded-full bg-white shadow-[0_18px_45px_rgba(16,185,129,0.18)] ring-8 ring-emerald-100/80">
            <CircleCheckBig className="size-12 text-emerald-500" strokeWidth={2.1} />
          </span>
          <h1 className="mt-5 font-heading text-3xl font-semibold text-plum-900 sm:text-4xl">Order confirmed!</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-plum-500 sm:text-base">
            {isBkash
              ? "We received your order and will verify your bKash payment, then call you to confirm delivery."
              : "We'll call you shortly to confirm delivery. Keep the cash ready and pay only when your order arrives."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {order && (
              <span className="rounded-full bg-plum-800 px-4 py-2 text-sm font-extrabold text-white shadow-sm">
                Order #{order}
              </span>
            )}
            {snap?.total && (
              <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-plum-700 ring-1 ring-plum-100">
                Total {snap.total}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-0 border-t border-plum-100 md:grid-cols-[1fr_0.95fr]">
          <div className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-plum-800">
              <Truck className="size-5 text-coral-500" strokeWidth={2.25} />
              What happens next
            </h2>
            <div className="mt-4 space-y-3">
              <Step icon={Phone} title="Confirmation call" copy="Our team will call you soon to confirm the order and delivery address." />
              <Step
                icon={PackageCheck}
                title={isBkash ? "Payment check" : "Order packing"}
                copy={isBkash ? "Your bKash payment will be verified before dispatch." : "Your items will be packed after phone confirmation."}
              />
              <Step icon={Home} title="Doorstep delivery" copy="Receive the parcel at home. For COD orders, pay after it arrives." />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-coral-500 px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition hover:bg-coral-600 active:scale-[0.98]"
              >
                Continue Shopping
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              {order && (
                <Link
                  href={`/track?order=${order}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-plum-200 bg-white px-6 py-3 text-sm font-extrabold text-plum-700 transition hover:bg-plum-50"
                >
                  <Clock3 className="size-4" strokeWidth={2.5} />
                  Track Order
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-plum-100 bg-plum-50/45 p-5 sm:p-6 md:border-l md:border-t-0">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-plum-800">
              <ReceiptText className="size-5 text-coral-500" strokeWidth={2.25} />
              Order details
            </h2>

            {snap ? (
              <>
                <ul className="mt-4 space-y-3 border-b border-plum-100 pb-4 text-sm text-plum-600">
                  {snap.items.map((it, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 leading-snug">
                        {it.name} <span className="whitespace-nowrap text-plum-400">x {it.qty}</span>
                      </span>
                      <span className="shrink-0 font-extrabold tabular-nums text-plum-800">{it.total}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-1.5 text-sm text-plum-500">
                  <Row label="Subtotal" value={snap.subtotal} />
                  {snap.discount && <Row label="Discount" value={`-${snap.discount}`} accent="text-emerald-600" />}
                  <Row label="Delivery" value={snap.delivery} />
                  {snap.fee && <Row label="bKash charge" value={snap.fee} />}
                </div>
                <div className="mt-3 flex justify-between rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-plum-900 shadow-sm ring-1 ring-plum-100">
                  <span>Total</span>
                  <span className="tabular-nums">{snap.total}</span>
                </div>

                <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm text-plum-700 ring-1 ring-plum-100">
                  <p className="font-extrabold">
                    {snap.method}
                    {snap.trxId && <span className="font-semibold text-plum-500"> · TrxID {snap.trxId}</span>}
                  </p>
                  <p className="flex items-start gap-2 text-plum-600">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-coral-500" strokeWidth={2.25} />
                    <span>
                      {snap.name} - {snap.address}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-plum-600">
                    <Phone className="size-4 shrink-0 text-coral-500" strokeWidth={2.25} />
                    {snap.phone}
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-plum-500 ring-1 ring-plum-100">
                Your order has been placed successfully. You can keep this page open or track your order with the order number above.
              </div>
            )}
          </div>
        </div>
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

function Step({
  icon: Icon,
  title,
  copy,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-plum-50/70 p-3.5 ring-1 ring-plum-100/70">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-coral-500 shadow-sm">
        <Icon className="size-5" strokeWidth={2.25} />
      </span>
      <span>
        <span className="block text-sm font-extrabold text-plum-800">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-plum-500">{copy}</span>
      </span>
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
