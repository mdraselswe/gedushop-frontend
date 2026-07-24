"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <button
      onClick={share}
      aria-label="Share this product"
      className="flex size-10 items-center justify-center rounded-full bg-white text-plum-600 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/60 transition-colors hover:text-coral-500"
    >
      {copied ? <Check className="size-4.5 text-emerald-600" strokeWidth={2.5} /> : <Share2 className="size-4.5" strokeWidth={2.25} />}
    </button>
  );
}
