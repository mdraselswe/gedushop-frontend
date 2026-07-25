"use client";

import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CouponField() {
  const { cart, applyCoupon, removeCoupon, couponLoading } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const coupons = cart?.coupons ?? [];

  async function apply() {
    setError(null);
    if (!code.trim()) return;
    const err = await applyCoupon(code);
    if (err) setError(err);
    else setCode("");
  }

  return (
    <div className="mt-3 border-t border-plum-100 pt-3">
      {coupons.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {coupons.map((c) => (
            <li key={c.code} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <span className="flex items-center gap-1.5">
                <Tag className="size-3.5" strokeWidth={2.5} />
                {c.code.toUpperCase()}
              </span>
              <button
                onClick={() => removeCoupon(c.code)}
                disabled={couponLoading}
                aria-label={`Remove coupon ${c.code}`}
                className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* plain div (not a <form>) so it can be embedded inside the checkout form
          without nesting forms, which caused a page flash on submit */}
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Coupon code"
          className="min-w-0 flex-1 rounded-xl border border-plum-100 bg-white px-3 py-2 text-sm text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
        />
        <button
          type="button"
          onClick={apply}
          disabled={couponLoading || !code.trim()}
          className="flex items-center gap-1.5 rounded-xl border border-plum-200 px-4 py-2 text-sm font-extrabold text-plum-600 transition-colors hover:bg-plum-50 disabled:opacity-50"
        >
          {couponLoading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-coral-600">{error}</p>}
    </div>
  );
}
