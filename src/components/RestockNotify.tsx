"use client";

import { useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { apiFetch, GEDU_API } from "@/lib/api";

/**
 * Out-of-stock capture: the customer leaves a phone number and the shop pings
 * them when the product is restocked (request lands in WP + Telegram).
 */
export default function RestockNotify({ productId }: { productId: number }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const p = phone.trim();
    if (!/^01[3-9]\d{8}$/.test(p)) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)");
      return;
    }
    setError(null);
    setState("sending");
    try {
      const r = await apiFetch(`${GEDU_API}/restock-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, phone: p }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setError(d?.error || "আবার চেষ্টা করুন");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
        ✅ ধন্যবাদ! পণ্যটি স্টকে এলেই আপনাকে জানানো হবে।
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-plum-50/60 p-4 ring-1 ring-plum-100/60">
      <p className="flex items-center gap-2 text-sm font-extrabold text-plum-700">
        <BellRing className="size-4.5 text-coral-500" strokeWidth={2.25} />
        স্টকে এলে জানান
      </p>
      <p className="mt-0.5 text-xs text-plum-500">নম্বর দিন — পণ্যটি এলেই আমরা আপনাকে জানাবো</p>
      <div className="mt-2.5 flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="01XXXXXXXXX"
          className="min-w-0 flex-1 rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
        />
        <button
          type="button"
          onClick={submit}
          disabled={state === "sending"}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-plum-600 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
        >
          {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : "জানান"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-coral-600">{error}</p>}
    </div>
  );
}
