"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Settings2, X } from "lucide-react";
import { CONSENT_OPEN, readConsent, saveConsent, type ConsentState } from "@/lib/consent";

export default function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = readConsent();
      if (saved) {
        setAnalytics(saved.analytics);
        setMarketing(saved.marketing);
      } else {
        setShow(true);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const open = () => {
      const saved = readConsent();
      setAnalytics(saved?.analytics ?? false);
      setMarketing(saved?.marketing ?? false);
      setManage(true);
      setShow(true);
    };
    window.addEventListener(CONSENT_OPEN, open);
    return () => window.removeEventListener(CONSENT_OPEN, open);
  }, []);

  if (!ready || !show) return null;

  function acceptAll() {
    persist({ analytics: true, marketing: true });
  }

  function rejectOptional() {
    persist({ analytics: false, marketing: false });
  }

  function saveChoices() {
    persist({ analytics, marketing });
  }

  function persist(next: Pick<ConsentState, "analytics" | "marketing">) {
    saveConsent(next);
    setAnalytics(next.analytics);
    setMarketing(next.marketing);
    setShow(false);
    setManage(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-plum-900/20 ring-1 ring-plum-100">
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-plum-800">Cookie preferences</h2>
              <p className="mt-1 text-sm leading-relaxed text-plum-500">
                We use essential storage for cart and orders. Analytics and ads cookies help us improve shopping and
                measure campaigns.
              </p>
              <Link href="/privacy" className="mt-1 inline-block text-xs font-bold text-coral-600 hover:underline">
                Privacy policy
              </Link>
            </div>
            <button
              type="button"
              onClick={rejectOptional}
              aria-label="Reject optional cookies"
              className="shrink-0 rounded-full p-1.5 text-plum-400 transition-colors hover:bg-plum-50 hover:text-plum-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          {manage && (
            <div className="grid gap-2 rounded-xl bg-plum-50/70 p-3">
              <ConsentRow title="Essential" text="Cart, checkout, saved orders and security." checked disabled />
              <ConsentRow title="Analytics" text="Google Analytics page and shopping performance reports." checked={analytics} onChange={setAnalytics} />
              <ConsentRow title="Ads" text="Meta Pixel events for ad measurement and retargeting." checked={marketing} onChange={setMarketing} />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {manage ? (
              <button
                type="button"
                onClick={saveChoices}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-coral-500/25 transition-colors hover:bg-coral-600"
              >
                <Check className="size-4" strokeWidth={2.5} />
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setManage(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-plum-200 px-5 py-2.5 text-sm font-extrabold text-plum-600 transition-colors hover:bg-plum-50"
              >
                <Settings2 className="size-4" strokeWidth={2.5} />
                Manage
              </button>
            )}
            <button
              type="button"
              onClick={rejectOptional}
              className="rounded-full border border-plum-200 px-5 py-2.5 text-sm font-extrabold text-plum-500 transition-colors hover:bg-plum-50"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-full bg-plum-700 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-plum-800"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title,
  text,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 rounded-lg bg-white px-3 py-2.5 ${disabled ? "cursor-default" : "cursor-pointer"}`}>
      <span>
        <span className="block text-sm font-extrabold text-plum-700">{title}</span>
        <span className="block text-xs leading-relaxed text-plum-400">{text}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-4 shrink-0 accent-coral-500 disabled:opacity-60"
      />
    </label>
  );
}
