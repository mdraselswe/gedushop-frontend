"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { CircleCheckBig } from "lucide-react";
import { fbTrack } from "@/lib/pixel";

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  const value = params.get("value");
  const tracked = useRef(false);

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

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-14 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-coral-50">
        <CircleCheckBig className="size-12 text-coral-500" strokeWidth={2} />
      </span>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-plum-700">Order confirmed!</h1>
      {order && (
        <p className="mt-2 rounded-full bg-plum-50 px-4 py-1.5 text-sm font-extrabold text-plum-600">
          Order #{order}
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-plum-500">
        We&apos;ll call you shortly to confirm delivery. Keep the cash ready — pay only when your
        order arrives.
      </p>
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

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
