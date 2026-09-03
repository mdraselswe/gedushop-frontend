"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, Loader2, PackageSearch, Search } from "lucide-react";
import { decodeEntities } from "@/lib/decode";
import { apiFetch, GEDU_API } from "@/lib/api";
import { getOrders, mergeOrders, type StoredOrder } from "@/lib/orderHistory";
import { STATUS_SHORT, formatOrderDate, isCancelled } from "@/lib/orderStatus";

/** How many rows refresh their status without being asked. */
const AUTO_REFRESH = 5;

/**
 * Fewer retries than the storefront's default six.
 *
 * A stale status from the device's own history is a perfectly good answer, and
 * five of these run at once — six backed-off attempts each would leave the page
 * spinning far longer than the information is worth.
 */
const STATUS_ATTEMPTS = 2;

interface LookupItem {
  name: string;
  quantity: number;
}
interface LookupOrder {
  id: number;
  status: string;
  dateCreated: string;
  total: string;
  currencySymbol: string;
  items: LookupItem[];
}

function toStored(o: LookupOrder, phone: string): StoredOrder {
  return {
    id: o.id,
    phone,
    date: o.dateCreated,
    total: `${o.currencySymbol}${Number(o.total).toLocaleString("en-IN")}`,
    summary: o.items.map((i) => `${decodeEntities(i.name)} × ${i.quantity}`).join(", "),
  };
}

export default function OrderList() {
  const [rows, setRows] = useState<StoredOrder[]>([]);
  /** Live Woo status per order id — absent until the tracker answers for that row. */
  const [live, setLive] = useState<Record<string, string>>({});
  /** False until the first localStorage read, so the empty state does not flash. */
  const [ready, setReady] = useState(false);
  /** How many rows have been asked about so far. */
  const [checked, setChecked] = useState(0);
  const [checking, setChecking] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const refreshed = useRef(false);

  const refresh = useCallback(async (list: StoredOrder[], from: number, count: number) => {
    const slice = list.slice(from, from + count);
    if (!slice.length) return;
    setChecking(true);
    const results = await Promise.all(
      slice.map(async (o) => {
        try {
          const res = await apiFetch(
            `${GEDU_API}/track`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: o.phone, order_id: String(o.id) }),
            },
            STATUS_ATTEMPTS,
          );
          if (!res.ok) return null;
          const data = await res.json();
          return [String(o.id), data.status as string] as const;
        } catch {
          // offline, or the order was deleted in wp-admin — keep the stored row
          return null;
        }
      }),
    );
    setLive((prev) => {
      const next = { ...prev };
      for (const r of results) if (r) next[r[0]] = r[1];
      return next;
    });
    setChecked(from + slice.length);
    setChecking(false);
  }, []);

  useEffect(() => {
    const stored = getOrders();
    setRows(stored);
    setReady(true);
    if (!refreshed.current && stored.length) {
      refreshed.current = true;
      void refresh(stored, 0, AUTO_REFRESH);
    }
  }, [refresh]);

  function onLookup(found: LookupOrder[], phone: string) {
    const stored = found.map((o) => toStored(o, phone));
    mergeOrders(stored);
    const merged = getOrders();
    setRows(merged);
    // The lookup already carried each status, so nothing needs re-asking.
    setLive((prev) => {
      const next = { ...prev };
      for (const o of found) next[String(o.id)] = o.status;
      return next;
    });
    setChecked(merged.length);
    setShowLookup(false);
  }

  if (!ready) {
    return <div className="mt-4 h-32 animate-pulse rounded-2xl bg-white" />;
  }

  const remaining = rows.length - checked;

  return (
    <div className="mt-4 space-y-4 pb-8">
      {(rows.length === 0 || showLookup) && (
        <LookupForm onFound={onLookup} hasRows={rows.length > 0} onCancel={() => setShowLookup(false)} />
      )}

      {rows.map((o) => {
        const status = live[String(o.id)];
        return (
          <div
            key={String(o.id)}
            className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum-100 bg-plum-50/50 px-5 py-3">
              <div>
                <p className="font-heading text-base font-semibold text-plum-700">Order #{o.id}</p>
                <p className="text-xs font-semibold text-plum-400">Placed {formatOrderDate(o.date)}</p>
              </div>
              {status ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    isCancelled(status)
                      ? "bg-coral-100 text-coral-700"
                      : status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-plum-600 text-white"
                  }`}
                >
                  {STATUS_SHORT[status] ?? status}
                </span>
              ) : (
                <span className="rounded-full bg-plum-100 px-3 py-1 text-xs font-extrabold text-plum-400">
                  {checking ? "Checking…" : "Not checked"}
                </span>
              )}
            </div>

            <div className="px-5 py-4">
              <p className="line-clamp-2 text-sm leading-relaxed text-plum-600">{o.summary}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-base font-extrabold tabular-nums text-plum-800">{o.total}</span>
                <Link
                  href={`/track?order=${o.id}&phone=${encodeURIComponent(o.phone)}`}
                  className="rounded-full border border-plum-200 px-5 py-2 text-xs font-extrabold text-plum-600 transition-colors hover:bg-plum-50"
                >
                  View details
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <button
          onClick={() => void refresh(rows, checked, AUTO_REFRESH)}
          disabled={checking}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-plum-200 px-4 py-3 text-sm font-extrabold text-plum-600 transition-colors hover:bg-plum-50 disabled:opacity-60"
        >
          {checking && <Loader2 className="size-4 animate-spin" />}
          Check status for {remaining} older order{remaining > 1 ? "s" : ""}
        </button>
      )}

      {rows.length > 0 && !showLookup && (
        <button
          onClick={() => setShowLookup(true)}
          className="w-full py-2 text-center text-sm font-bold text-plum-400 underline underline-offset-4 hover:text-coral-500"
        >
          Ordered from another phone or device?
        </button>
      )}
    </div>
  );
}

function LookupForm({
  onFound,
  hasRows,
  onCancel,
}: {
  onFound: (orders: LookupOrder[], phone: string) => void;
  hasRows: boolean;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), order_id: orderId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "We could not find that order.");
        return;
      }
      if (!data.orders?.length) {
        setError("No orders found for that number.");
        return;
      }
      onFound(data.orders, phone.trim());
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-plum-100 bg-white px-4 py-3 text-sm text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
      {!hasRows && (
        <div className="mb-4 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-plum-50">
            <PackageSearch className="size-7 text-plum-400" strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm font-bold text-plum-700">No orders saved on this device</p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-plum-500">
            Enter your mobile number and any one of your order numbers — we&apos;ll pull up the rest.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-3">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number (01XXXXXXXXX)"
          className={inputCls}
          type="tel"
          required
        />
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Any one of your order numbers"
          className={inputCls}
          inputMode="numeric"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 transition-colors hover:bg-coral-600 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" strokeWidth={2.5} />}
          Find my orders
        </button>
        {hasRows && (
          <button
            type="button"
            onClick={onCancel}
            className="py-1 text-center text-sm font-bold text-plum-400 hover:text-coral-500"
          >
            Cancel
          </button>
        )}
      </form>

      {error && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
          <CircleAlert className="size-5 shrink-0" strokeWidth={2.25} />
          {error}
        </div>
      )}
    </div>
  );
}
