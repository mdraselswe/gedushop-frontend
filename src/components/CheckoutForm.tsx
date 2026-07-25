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
import { apiFetch, STORE_API } from "@/lib/api";
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

export default function CheckoutForm() {
  const { cart, loading, updateShipping, shippingLoading } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedCheckout = useRef(false);

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
          payment_method: "cod",
          customer_note: form.note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message?.replace(/<[^>]+>/g, "") || "Order failed. Please try again.");
        return;
      }
      localStorage.removeItem(TOKEN_KEY); // cart is consumed by the order
      const minor = cart?.totals.currency_minor_unit ?? 2;
      const value = (Number(cart?.totals.total_price ?? 0) / 10 ** minor).toFixed(2);
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
          pattern="01[0-9]{9}"
          title="11-digit Bangladeshi mobile number starting with 01"
          autoComplete="tel"
        />
        <input value={form.email} onChange={set("email")} placeholder="Email (optional)" className={inputCls} type="email" autoComplete="email" />
        <input required value={form.address} onChange={set("address")} placeholder="Full delivery address *" className={inputCls} autoComplete="street-address" />
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
      </div>

      <div className="h-fit rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 md:sticky md:top-20">
        <h2 className="font-heading text-base font-semibold tracking-tight text-plum-800">Order Summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-plum-600">
          {cart.items.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-3">
              <span className="leading-snug">
                {decodeEntities(item.name)} <span className="whitespace-nowrap text-plum-400">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-bold">{formatPrice(item.totals.line_total, item.totals)}</span>
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
        <div className="mt-2 flex justify-between border-t border-plum-100 pt-3 text-lg font-extrabold text-plum-800">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(totalDisplay, cart.totals)}</span>
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-coral-50 px-3 py-2 text-xs font-bold text-coral-700">
          <Banknote className="size-4 shrink-0" strokeWidth={2.25} />
          Cash on Delivery — pay when your order arrives
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
