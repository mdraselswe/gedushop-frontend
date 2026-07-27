"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { fbTrack } from "@/lib/pixel";
import { DISTRICTS } from "@/lib/districts";
import { apiFetch, GEDU_API, STORE_API } from "@/lib/api";
import CouponField from "./CouponField";

const TOKEN_KEY = "gedu-cart-token";

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  district: string; // WooCommerce state code, e.g. BD-13
  note: string;
}

const EMPTY: FormState = { name: "", phone: "", email: "", address: "", area: "", district: "", note: "" };

/** Official bKash logomark (brand pink). Sized by height, width auto — no aspect mismatch. */
function BkashLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="61 0 58 54" className={`w-auto text-[#E2136E] ${className}`} fill="currentColor" aria-hidden>
      <path d="m82.9 25.9 3.3 14.6 21.5-10.7zM89 3.8 83.2 25l24 3.8zM62.8.6l25.5 3.1-6 21.8zM62.5 4.8h3l8 10.3zM108.4 29.6l-7.5-10.3 12-2.3zM107.2 32.5l.7-2.2-18.7 9.6zM82.4 26.3 86.3 44l-11.6 9.4zM111.8 22.3h7l-5.1-5.1z" />
    </svg>
  );
}

export default function CheckoutForm() {
  const { cart, loading, updateShipping, shippingLoading } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedCheckout = useRef(false);

  const [method, setMethod] = useState<"cod" | "bkash">("cod");
  const [trxId, setTrxId] = useState("");
  const [sender, setSender] = useState("");
  const [bkashCfg, setBkashCfg] = useState<{ enabled: boolean; number: string; fee: number }>({
    enabled: false,
    number: "",
    fee: 1.85,
  });

  useEffect(() => {
    apiFetch(`${GEDU_API}/payment`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.bkash && setBkashCfg(d.bkash))
      .catch(() => {});
  }, []);

  // Fire InitiateCheckout once the cart is loaded with items.
  useEffect(() => {
    if (trackedCheckout.current || !cart || cart.items.length === 0) return;
    trackedCheckout.current = true;
    const minor = cart.totals.currency_minor_unit ?? 2;
    fbTrack("InitiateCheckout", {
      currency: "BDT",
      value: Number(cart.totals.total_price) / 10 ** minor,
      num_items: cart.items_count,
    });
  }, [cart]);

  function set<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function onDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const district = e.target.value;
    setForm((f) => ({ ...f, district }));
    if (district) {
      // Recalculate delivery charge for the chosen district
      updateShipping({ country: "BD", state: district, city: form.area.trim() || undefined });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      setError("Please enter a valid Bangladeshi mobile number (11 digits, e.g. 01712345678).");
      return;
    }
    if (method === "bkash" && !trxId.trim()) {
      setError("Please enter your bKash Transaction ID after sending the money.");
      return;
    }
    setSubmitting(true);

    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const address = {
      first_name: firstName,
      last_name: rest.join(" "),
      address_1: form.address.trim(),
      city: form.area.trim() || DISTRICTS.find((d) => d.code === form.district)?.name || "",
      state: form.district,
      country: "BD",
      phone: form.phone.trim(),
      // WooCommerce requires an email; most COD customers here don't use one,
      // so fall back to a per-order placeholder the shop owner can recognize.
      email: form.email.trim() || `order.${form.phone.replace(/\D/g, "")}@gedushop.com`,
    };

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await apiFetch(`${STORE_API}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Cart-Token": token } : {}),
        },
        body: JSON.stringify({
          billing_address: address,
          shipping_address: address,
          payment_method: method,
          customer_note: form.note.trim(),
          ...(method === "bkash"
            ? { extensions: { gedushop: { trx_id: trxId.trim(), sender: sender.trim() } } }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message?.replace(/<[^>]+>/g, "") || "Order failed. Please try again.");
        return;
      }
      localStorage.removeItem(TOKEN_KEY); // cart is consumed by the order
      // Snapshot for the success page (order details without any backend call).
      try {
        sessionStorage.setItem(
          "gedu_last_order",
          JSON.stringify({
            id: data.order_id,
            items: cart!.items.map((i) => ({
              name: decodeEntities(i.name),
              qty: i.quantity,
              total: formatPrice(i.totals.line_subtotal, i.totals),
            })),
            subtotal: formatPrice(cart!.totals.total_items, cart!.totals),
            discount:
              Number(cart!.totals.total_discount) > 0
                ? formatPrice(cart!.totals.total_discount, cart!.totals)
                : null,
            delivery: shippingIsFree ? "FREE" : formatPrice(shipping ?? "0", cart!.totals),
            fee: bkashFee > 0 ? formatPrice(String(bkashFee), cart!.totals) : null,
            total: formatPrice(String(grandTotal), cart!.totals),
            method: method === "bkash" ? "bKash" : "Cash on Delivery",
            trxId: method === "bkash" ? trxId.trim() : null,
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: `${form.address.trim()}${form.area.trim() ? ", " + form.area.trim() : ""}, ${
              DISTRICTS.find((d) => d.code === form.district)?.name ?? ""
            }`,
          }),
        );
      } catch {
        // storage unavailable — success page falls back to the simple view
      }
      const minor = cart?.totals.currency_minor_unit ?? 2;
      const value = (grandTotal / 10 ** minor).toFixed(2);
      router.push(`/checkout/success?order=${data.order_id}&value=${value}`);
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white" />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-plum-50">
          <ShoppingCart className="size-9 text-plum-300" strokeWidth={1.75} />
        </span>
        <p className="font-semibold text-plum-500">Your cart is empty — add something first</p>
        <Link href="/" className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-coral-600">
          Start Shopping
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-plum-100 bg-white px-4 py-3 text-sm text-plum-800 placeholder:text-plum-300 shadow-[var(--shadow-soft)] outline-none transition focus:border-plum-300 focus:ring-2 focus:ring-plum-200/60";

  const shipping = cart.totals.total_shipping;
  const shippingIsFree = form.district !== "" && !shippingLoading && (shipping === "0" || shipping === null);

  // Before a district is picked, Woo applies a default flat rate — don't add that
  // phantom shipping to the shown Total (it says "Select district"). Once a district
  // is chosen, use Woo's authoritative total (correct rate / free over ৳2000).
  const totalDisplay =
    form.district && !shippingLoading
      ? cart.totals.total_price
      : String(Number(cart.totals.total_items) - Number(cart.totals.total_discount));

  // bKash send-money charge, rounded to whole taka (matches the server-side fee).
  const minorFactor = 10 ** (cart.totals.currency_minor_unit ?? 2);
  const bkashFee =
    method === "bkash" && bkashCfg.enabled
      ? Math.round((Number(totalDisplay) / minorFactor) * (bkashCfg.fee / 100)) * minorFactor
      : 0;
  const grandTotal = Number(totalDisplay) + bkashFee;

  function renderDelivery() {
    if (!form.district) return <span className="text-plum-300">Select district</span>;
    if (shippingLoading) return <Loader2 className="size-4 animate-spin text-plum-400" />;
    if (shippingIsFree) return <span className="font-bold text-emerald-600">FREE</span>;
    return <span>{formatPrice(shipping ?? "0", cart!.totals)}</span>;
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-5 pb-8 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        <input required value={form.name} onChange={set("name")} placeholder="Full name *" className={inputCls} autoComplete="name" />
        <input
          required
          value={form.phone}
          onChange={set("phone")}
          placeholder="Mobile number (01XXXXXXXXX) *"
          className={inputCls}
          type="tel"
          pattern="01[3-9][0-9]{8}"
          title="11-digit Bangladeshi mobile number, e.g. 01712345678"
          autoComplete="tel"
        />
        <input value={form.email} onChange={set("email")} placeholder="Email (optional)" className={inputCls} type="email" autoComplete="email" />
        <textarea
          required
          value={form.address}
          onChange={set("address")}
          placeholder="Full delivery address (house, road, area) *"
          rows={2}
          className={inputCls}
          autoComplete="street-address"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            required
            value={form.district}
            onChange={onDistrictChange}
            className={`${inputCls} ${form.district ? "text-plum-800" : "text-plum-300"}`}
          >
            <option value="" disabled>
              Select district *
            </option>
            {DISTRICTS.map((d) => (
              <option key={d.code} value={d.code} className="text-plum-800">
                {d.name}
              </option>
            ))}
          </select>
          <input value={form.area} onChange={set("area")} placeholder="Area / Thana (optional)" className={inputCls} autoComplete="address-level3" />
        </div>
        <textarea value={form.note} onChange={set("note")} placeholder="Order note (optional)" rows={2} className={inputCls} />

        {/* Payment method */}
        <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
          <h3 className="mb-2.5 text-sm font-bold text-plum-700">Payment method</h3>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                method === "cod" ? "border-coral-500 bg-coral-50/40" : "border-plum-100"
              }`}
            >
              <input type="radio" name="pay" checked={method === "cod"} onChange={() => setMethod("cod")} className="size-4 accent-coral-500" />
              <span className="flex w-6 shrink-0 justify-center">
                <Banknote className="size-5 text-emerald-600" strokeWidth={2} />
              </span>
              <span className="text-sm font-bold text-plum-800">Cash on Delivery</span>
            </label>
            {bkashCfg.enabled && (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                  method === "bkash" ? "border-coral-500 bg-coral-50/40" : "border-plum-100"
                }`}
              >
                <input type="radio" name="pay" checked={method === "bkash"} onChange={() => setMethod("bkash")} className="size-4 accent-coral-500" />
                <span className="flex w-6 shrink-0 justify-center">
                  <BkashLogo className="h-5" />
                </span>
                <span className="text-sm font-bold text-plum-800">
                  bKash <span className="font-normal text-plum-400">(+{bkashCfg.fee}% charge)</span>
                </span>
              </label>
            )}
          </div>

          {method === "bkash" && bkashCfg.enabled && (
            <div className="mt-3 space-y-2.5 rounded-xl bg-plum-50/60 p-3.5 text-sm text-plum-700">
              <p>
                <span className="font-extrabold">Send Money</span> of{" "}
                <span className="font-extrabold text-plum-900">{formatPrice(String(grandTotal), cart.totals)}</span> to our bKash number:
              </p>
              <p className="text-lg font-extrabold tracking-wide text-plum-900">{bkashCfg.number}</p>
              <p className="text-xs text-plum-500">
                Open bKash → Send Money → enter the number → send the exact amount → then put the Transaction ID below.
              </p>
              <input
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="bKash Transaction ID *"
                className={inputCls}
              />
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Your bKash number (optional)"
                type="tel"
                className={inputCls}
              />
            </div>
          )}
        </div>
      </div>

      <div className="h-fit rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 md:sticky md:top-20">
        <h2 className="font-heading text-base font-semibold tracking-tight text-plum-800">Order Summary</h2>
        <ul className="mt-4 space-y-3">
          {cart.items.map((item) => (
            <li key={item.key} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="size-14 overflow-hidden rounded-xl bg-gradient-to-br from-plum-50 to-coral-50/40 ring-1 ring-plum-100">
                  {item.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0].thumbnail || item.images[0].src}
                      alt={decodeEntities(item.name)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-plum-600 text-[11px] font-extrabold text-white ring-2 ring-white">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-plum-800">{decodeEntities(item.name)}</p>
                <p className="mt-0.5 text-xs text-plum-400 tabular-nums">
                  {formatPrice(item.prices.price, item.prices)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold text-plum-700 tabular-nums">
                {formatPrice(item.totals.line_subtotal, item.totals)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-plum-100 pt-2 text-sm text-plum-500">
          <span>Subtotal</span>
          <span>{formatPrice(cart.totals.total_items, cart.totals)}</span>
        </div>
        {Number(cart.totals.total_discount) > 0 && (
          <div className="mt-1 flex justify-between text-sm font-semibold text-emerald-600">
            <span>Discount</span>
            <span>−{formatPrice(cart.totals.total_discount, cart.totals)}</span>
          </div>
        )}
        <CouponField />
        <div className="mt-3 flex items-center justify-between text-sm text-plum-500">
          <span>Delivery</span>
          {renderDelivery()}
        </div>
        {bkashFee > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-plum-500">
            <span>bKash charge ({bkashCfg.fee}%)</span>
            <span className="tabular-nums">{formatPrice(String(bkashFee), cart.totals)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-plum-100 pt-3 text-lg font-extrabold text-plum-800">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(String(grandTotal), cart.totals)}</span>
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-coral-50 px-3 py-2 text-xs font-bold text-coral-700">
          <Banknote className="size-4 shrink-0" strokeWidth={2.25} />
          {method === "bkash"
            ? "bKash Send Money now, then place your order"
            : "Cash on Delivery — pay when your order arrives"}
        </p>
        <p className="mt-2 text-center text-[11px] font-semibold text-plum-400">
          Free delivery on orders over ৳2,000
        </p>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || shippingLoading}
          className="mt-4 w-full rounded-full bg-coral-500 py-3.5 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-600 active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </form>
  );
}
