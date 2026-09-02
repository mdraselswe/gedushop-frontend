"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { cartItemsTotal } from "@/lib/cart-total";
import { fbTrack } from "@/lib/pixel";
import { DHAKA_AREAS, DHAKA_CODE, DISTRICTS } from "@/lib/districts";
import { apiFetch, GEDU_API, STORE_API } from "@/lib/api";
import CouponField from "./CouponField";

const TOKEN_KEY = "gedu-cart-token";

/**
 * How long the checkout stays quiet before a snapshot is sent.
 *
 * Long enough that typing a phone number is one request rather than eleven,
 * short enough to catch somebody who fills the form and closes the tab.
 */
const BEACON_DEBOUNCE_MS = 2500;

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
  /** Stops the abandoned-cart beacon once the order is actually placed. */
  const orderPlaced = useRef(false);
  /** The last snapshot sent, so a keystroke that changes nothing sends nothing. */
  const lastBeacon = useRef<string | null>(null);

  // Ticked to begin with: the terms are the ordinary ones, and a customer who
  // wants to read them can — untick it and the order will not go.
  const [agreed, setAgreed] = useState(true);
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
  //
  // Merchandise value only. The event fires on mount, before a district has
  // been picked, so total_price here still carries Woo's default flat-rate
  // shipping — reporting it would have inflated every InitiateCheckout by the
  // delivery charge and skewed the ad numbers. Purchase, fired on the success
  // page, is the one that carries real delivery + bKash fee.
  useEffect(() => {
    if (trackedCheckout.current || !cart || cart.items.length === 0) return;
    trackedCheckout.current = true;
    const minor = cart.totals.currency_minor_unit ?? 2;
    fbTrack("InitiateCheckout", {
      currency: "BDT",
      value: Number(cartItemsTotal(cart.totals)) / 10 ** minor,
      num_items: cart.items_count,
    });
  }, [cart]);

  // The abandoned-cart beacon.
  //
  // Roughly four out of five people who reach this form never place the order,
  // and WooCommerce keeps nothing about them: its cart is an anonymous session
  // and no name or phone exists anywhere until it is typed here. So once the
  // number is complete, what has been filled in so far is posted to the shop's
  // own app, where it becomes a row on the call list — somebody rings and asks
  // if they want to finish. Sending stops the moment the order goes through.
  //
  // Posted to a Pages Function rather than straight to the app: the site is a
  // static export, so the shared secret has to live at the edge (see
  // functions/abandoned.js).
  useEffect(() => {
    if (orderPlaced.current) return;
    if (!cart || cart.items.length === 0) return;
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) return;

    const minor = cart.totals.currency_minor_unit ?? 2;
    const payload = JSON.stringify({
      phone: form.phone.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      area: form.area.trim(),
      // The readable name, not "BD-13" — this is read off a screen by whoever
      // makes the call, the same reason the lead importer resolves it too.
      district: DISTRICTS.find((d) => d.code === form.district)?.name ?? "",
      items: cart.items.map((i) => ({
        productId: i.id,
        name: decodeEntities(i.name),
        quantity: i.quantity,
        lineTotal: Number(i.totals.line_total) / 10 ** minor,
      })),
      // Merchandise only, as InitiateCheckout reports it — no delivery charge,
      // because at this point a district may not have been picked and Woo's
      // default flat rate would be quoted to the caller as if it were real.
      total: Number(cartItemsTotal(cart.totals)) / 10 ** minor,
    });

    // Every keystroke lands here. Only a payload that differs from the last one
    // sent is worth a request, and only after they have paused.
    if (payload === lastBeacon.current) return;
    const timer = setTimeout(() => {
      lastBeacon.current = payload;
      // keepalive so a send started as they navigate away still completes.
      fetch("/abandoned", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // The shop's app being unreachable must never surface in a checkout.
        // Clearing this lets the next keystroke try again.
        lastBeacon.current = null;
      });
    }, BEACON_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [cart, form.phone, form.name, form.address, form.area, form.district]);

  function set<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function onDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const district = e.target.value;
    // The area belongs to the district it was picked under — a Dhaka thana is
    // not an option anywhere else, and free text typed for another district is
    // not one of Dhaka's — so a district change always clears it.
    setForm((f) => ({ ...f, district, area: "" }));
    // Every district but Dhaka is priced by the district alone. Dhaka's charge
    // depends on which area it is, so it waits for onAreaChange.
    if (district && district !== DHAKA_CODE) {
      // Recalculate delivery charge for the chosen district. city is sent
      // empty on purpose: update-customer merges, so an area left over from a
      // previous district would otherwise stay on the customer.
      updateShipping({ country: "BD", state: district, city: "" });
    }
  }

  function onAreaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const area = e.target.value;
    setForm((f) => ({ ...f, area }));
    // Inside Dhaka only for Dhaka Sadar; WordPress decides that from the city.
    if (area) updateShipping({ country: "BD", state: DHAKA_CODE, city: area });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      setError("Please enter a valid Bangladeshi mobile number (11 digits, e.g. 01712345678).");
      return;
    }
    // The area is what decides Dhaka's delivery charge, so an order cannot go
    // without one. The select is `required` too — this is the guard that does
    // not depend on the browser honouring it.
    if (form.district === DHAKA_CODE && !DHAKA_AREAS.includes(form.area)) {
      setError("Please select your area / thana.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms & Conditions to place your order.");
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
      // They ordered, so no snapshot must follow them onto the call list. The
      // app clears the row too when the order webhook lands, but that is a
      // race — the customer's own browser knows first, and knows for certain.
      orderPlaced.current = true;
      // Snapshot for the success page (order details without any backend call).
      try {
        sessionStorage.setItem(
          "gedu_last_order",
          JSON.stringify({
            id: data.order_id,
            items: cart!.items.map((i) => ({
              // Parent product id — the same value AddToCart/ViewContent report as
              // content_ids, so Purchase lines up against the same catalogue entry.
              productId: i.id,
              name:
                decodeEntities(i.name) +
                (i.variation?.length ? ` (${i.variation.map((v) => v.value).join(", ")})` : ""),
              qty: i.quantity,
              total: formatPrice(i.totals.line_subtotal, i.totals),
              // Unit price in taka (not minor units) — Meta's contents[].item_price.
              unitPrice:
                Number(i.prices.price) / 10 ** (i.prices.currency_minor_unit ?? 2),
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
  const isDhaka = form.district === DHAKA_CODE;
  // Dhaka is the one district the charge cannot be read off: Dhaka Sadar is
  // inside the city, its other areas are not. So it is priced once the area is
  // in, and every other district as soon as it is picked.
  const locationReady = form.district !== "" && (!isDhaka || form.area !== "");
  const shippingIsFree = locationReady && !shippingLoading && (shipping === "0" || shipping === null);

  // Before the delivery location is known, Woo applies a default flat rate — don't
  // add that phantom shipping to the shown Total (it says "Select district"/"Select
  // area"). Once it is known, use Woo's authoritative total (correct rate / free
  // over ৳2000).
  const totalDisplay =
    locationReady && !shippingLoading ? cart.totals.total_price : cartItemsTotal(cart.totals);

  // bKash send-money charge, rounded to whole taka (matches the server-side fee).
  const minorFactor = 10 ** (cart.totals.currency_minor_unit ?? 2);
  const bkashFee =
    method === "bkash" && bkashCfg.enabled
      ? Math.round((Number(totalDisplay) / minorFactor) * (bkashCfg.fee / 100)) * minorFactor
      : 0;
  const grandTotal = Number(totalDisplay) + bkashFee;

  function renderDelivery() {
    if (!form.district) return <span className="text-plum-300">Select district</span>;
    if (isDhaka && !form.area) return <span className="text-plum-300">Select area</span>;
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
        {/* Said out loud because it is true from the keystroke after this one:
            the number is saved as it is typed, not when the order is placed
            (see the abandoned-cart beacon above). A customer who gets a call
            about a basket they abandoned should have been told it could
            happen, and hearing it as an offer of help is the difference
            between a useful call and an unwelcome one. */}
        <p className="-mt-1 px-1 text-xs text-plum-400">
          If you don&apos;t finish your order, we may call this number to help.
        </p>
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
          {isDhaka ? (
            <select
              required
              value={form.area}
              onChange={onAreaChange}
              className={`${inputCls} ${form.area ? "text-plum-800" : "text-plum-300"}`}
            >
              <option value="" disabled>
                Select area / thana *
              </option>
              {DHAKA_AREAS.map((a) => (
                <option key={a} value={a} className="text-plum-800">
                  {a}
                </option>
              ))}
            </select>
          ) : (
            <input value={form.area} onChange={set("area")} placeholder="Area / Thana (optional)" className={inputCls} autoComplete="address-level3" />
          )}
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
                {item.variation && item.variation.length > 0 && (
                  <p className="mt-0.5 text-xs font-semibold text-plum-400">
                    {item.variation.map((v) => `${v.attribute}: ${v.value}`).join(" · ")}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-plum-400 tabular-nums">
                  {Number(item.prices.regular_price) > Number(item.prices.price) && (
                    <span className="mr-1 text-plum-300 line-through">
                      {formatPrice(item.prices.regular_price, item.prices)}
                    </span>
                  )}
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
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs font-semibold text-plum-500">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-px size-4 shrink-0 accent-coral-500"
          />
          <span>
            I agree to the{" "}
            {/* New tab on purpose: reading the terms must not throw away a
                half-filled checkout form. */}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-coral-600 underline underline-offset-2 hover:text-coral-700"
            >
              Terms &amp; Conditions
            </Link>
          </span>
        </label>
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
