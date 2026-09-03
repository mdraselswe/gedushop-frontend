"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, CircleAlert, Loader2, PackageCheck, Search } from "lucide-react";
import { decodeEntities } from "@/lib/decode";
import { apiFetch, GEDU_API } from "@/lib/api";
import { addOrder } from "@/lib/orderHistory";
import { STATUS_LABEL, STATUS_STEP, STEPS, formatOrderDate as formatDate } from "@/lib/orderStatus";

interface TrackedItem {
  name: string;
  quantity: number;
  total: string;
}
interface TrackResult {
  id: number;
  status: string;
  isCancelled: boolean;
  dateCreated: string;
  shipping: string;
  total: string;
  currencySymbol: string;
  paymentMethodTitle: string;
  customerName: string;
  items: TrackedItem[];
}

function OrderTrackerInner() {
  const params = useSearchParams();
  // Both are handed straight through from a link built with data the caller
  // already knows for certain — the checkout success page, or "View details"
  // on the device's own order list — so there's no reason to make somebody
  // retype what got them here.
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [orderId, setOrderId] = useState(params.get("order") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function track(orderIdVal: string, phoneVal: string) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await apiFetch(`${GEDU_API}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneVal, order_id: orderIdVal }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setResult(data);
        // Tracking an order proves this device owns it, so remember it — a
        // customer who lands here from a confirmation call now has a history
        // even though they never checked out in this browser.
        addOrder({
          id: data.id,
          phone: phoneVal.trim(),
          date: data.dateCreated,
          total: `${data.currencySymbol}${Number(data.total).toLocaleString("en-IN")}`,
          summary: (data.items as TrackedItem[])
            .map((i) => `${decodeEntities(i.name)} × ${i.quantity}`)
            .join(", "),
        });
      }
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void track(orderId, phone);
  }

  // Once, on arrival: a link that already names both fields skips straight to
  // the result instead of making the customer press the button a second time.
  // Order id alone (an old bookmark, a checkout-success link) is left as a
  // plain pre-filled form — there's no phone to search with yet.
  const autoTracked = useRef(false);
  useEffect(() => {
    if (autoTracked.current) return;
    autoTracked.current = true;
    const o = params.get("order");
    const p = params.get("phone");
    // Deferred a tick: track()'s first line is setLoading(true), and calling
    // that synchronously inside the effect body is what this lint rule
    // actually flags — not the fetch itself.
    if (o && p) queueMicrotask(() => void track(o, p));
    // Runs once against the URL this page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputCls =
    "w-full rounded-xl border border-plum-100 bg-white px-4 py-3 text-sm text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100";

  const step = result ? (STATUS_STEP[result.status] ?? 0) : 0;

  return (
    <div className="mt-4 space-y-5 pb-8">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order number (e.g. 1923)"
          className={inputCls}
          inputMode="numeric"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number (01XXXXXXXXX)"
          className={inputCls}
          type="tel"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 transition-colors hover:bg-coral-600 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" strokeWidth={2.5} />}
          Track
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
          <CircleAlert className="size-5 shrink-0" strokeWidth={2.25} />
          {error}
        </div>
      )}

      {result && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum-100 bg-plum-50/50 px-5 py-3">
            <div>
              <p className="font-heading text-base font-semibold text-plum-700">Order #{result.id}</p>
              <p className="text-xs font-semibold text-plum-400">Placed {formatDate(result.dateCreated)}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                result.isCancelled ? "bg-coral-100 text-coral-700" : "bg-plum-600 text-white"
              }`}
            >
              {STATUS_LABEL[result.status] ?? result.status}
            </span>
          </div>

          <div className="p-5">
            {result.isCancelled ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
                <CircleAlert className="size-5 shrink-0" strokeWidth={2.25} />
                This order was {result.status}. Contact us if you think this is a mistake.
              </div>
            ) : (
              <ol className="flex items-center">
                {STEPS.map((label, i) => {
                  const done = i <= step;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <li key={label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                            done ? "bg-plum-600 text-white" : "bg-plum-100 text-plum-300"
                          }`}
                        >
                          {i === STEPS.length - 1 ? (
                            <PackageCheck className="size-5" strokeWidth={2.25} />
                          ) : done ? (
                            <Check className="size-5" strokeWidth={3} />
                          ) : (
                            <span className="text-sm font-extrabold">{i + 1}</span>
                          )}
                        </span>
                        <span className={`w-20 text-center text-[11px] font-bold leading-tight ${done ? "text-plum-700" : "text-plum-300"}`}>
                          {label}
                        </span>
                      </div>
                      {!isLast && <span className={`mx-1 h-1 flex-1 rounded-full ${i < step ? "bg-plum-600" : "bg-plum-100"}`} />}
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-5 space-y-2 border-t border-plum-100 pt-4 text-sm text-plum-600">
              {result.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="line-clamp-1">
                    {decodeEntities(it.name)} × {it.quantity}
                  </span>
                  <span className="shrink-0 font-bold">
                    {result.currencySymbol}
                    {Number(it.total).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-plum-100 pt-3 text-sm text-plum-500">
              <span>Delivery</span>
              <span className="tabular-nums">
                {Number(result.shipping) > 0 ? (
                  <>
                    {result.currencySymbol}
                    {Number(result.shipping).toLocaleString("en-IN")}
                  </>
                ) : (
                  <span className="font-bold text-emerald-600">FREE</span>
                )}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-plum-100 pt-2 text-base font-extrabold text-plum-800">
              <span>Total ({result.paymentMethodTitle})</span>
              <span className="tabular-nums">
                {result.currencySymbol}
                {Number(result.total).toLocaleString("en-IN")}
              </span>
            </div>

            <Link
              href="/my-orders"
              className="mt-4 flex justify-center rounded-xl bg-plum-50 px-4 py-2.5 text-sm font-extrabold text-plum-600 transition-colors hover:bg-plum-100"
            >
              See all my orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTracker() {
  return (
    <Suspense fallback={<div className="mt-4 h-24 animate-pulse rounded-2xl bg-white" />}>
      <OrderTrackerInner />
    </Suspense>
  );
}
