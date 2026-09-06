"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Gift, X } from "lucide-react";
import { apiFetch, GEDU_API } from "@/lib/api";

interface RoutePopupConfig {
  id: string;
  title: string;
  message: string;
  routes: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  frequency?: "always" | "once_per_session" | "once_per_browser";
}

const STORAGE_PREFIX = "gedu_popup_dismissed:";

function normalizePath(path: string): string {
  const clean = (path || "/").split(/[?#]/)[0] || "/";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  return withSlash !== "/" ? withSlash.replace(/\/+$/, "") : "/";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeMatches(pattern: string, pathname: string): boolean {
  const cleanPattern = pattern.trim();
  if (!cleanPattern) return false;
  if (cleanPattern === "*") return true;

  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(cleanPattern);

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }

  if (normalizedPattern.includes(":") || normalizedPattern.includes("*")) {
    const source = escapeRegex(normalizedPattern)
      .replace(/\\\*/g, ".*")
      .replace(/:[A-Za-z0-9_]+/g, "[^/]+");
    return new RegExp(`^${source}$`).test(normalizedPath);
  }

  return normalizedPath === normalizedPattern;
}

function isDismissed(popup: RoutePopupConfig): boolean {
  if (typeof window === "undefined") return true;
  const key = `${STORAGE_PREFIX}${popup.id}`;
  if (popup.frequency === "once_per_browser") return window.localStorage.getItem(key) === "1";
  if (popup.frequency === "always") return false;
  return window.sessionStorage.getItem(key) === "1";
}

function markDismissed(popup: RoutePopupConfig) {
  if (typeof window === "undefined" || popup.frequency === "always") return;
  const key = `${STORAGE_PREFIX}${popup.id}`;
  const storage = popup.frequency === "once_per_browser" ? window.localStorage : window.sessionStorage;
  storage.setItem(key, "1");
}

/**
 * Route-aware marketing/info popup. Config is read from WordPress at runtime,
 * so the shop owner can turn a popup on/off without rebuilding the static site.
 */
export default function RoutePopup() {
  const pathname = usePathname();
  const [popups, setPopups] = useState<RoutePopupConfig[]>([]);
  const [closedPopup, setClosedPopup] = useState<{ id: string; pathname: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${GEDU_API}/popups`, { cache: "no-store" }, 3)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setPopups(
          data.filter(
            (item): item is RoutePopupConfig =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              typeof item.message === "string" &&
              Array.isArray(item.routes),
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const popup = useMemo(() => {
    return popups.find((item) => {
      if (closedPopup?.id === item.id && closedPopup.pathname === pathname) return false;
      if (isDismissed(item)) return false;
      return item.routes.some((route) => routeMatches(route, pathname));
    });
  }, [closedPopup, pathname, popups]);

  useEffect(() => {
    if (!popup) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
    // closePopup only depends on the current popup id; keeping it inline would
    // make the body-lock effect harder to read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup?.id]);

  if (!popup) return null;

  function closePopup() {
    if (!popup) return;
    markDismissed(popup);
    setClosedPopup({ id: popup.id, pathname });
  }

  const ctaUrl = popup.ctaUrl?.trim();
  const ctaLabel = popup.ctaLabel?.trim();
  const external = !!ctaUrl && /^https?:\/\//i.test(ctaUrl);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-plum-950/55 px-3 py-4 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-popup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePopup();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_rgba(34,28,54,0.38)] ring-1 ring-white/80 sm:rounded-3xl">
        <div className="relative min-h-48 overflow-hidden bg-[radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.32),transparent_24%),radial-gradient(circle_at_12%_88%,rgba(250,197,193,0.35),transparent_30%),linear-gradient(135deg,#221c36_0%,#4f4274_48%,#e96d65_100%)] px-5 pb-14 pt-5 text-white sm:min-h-56 sm:px-7 sm:pt-7">
          <span className="absolute -right-12 top-7 size-36 rounded-[2rem] bg-white/12 rotate-12 ring-1 ring-white/20" aria-hidden />
          <span className="absolute right-8 top-20 size-20 rounded-full bg-coral-200/25 blur-sm" aria-hidden />
          <span className="absolute bottom-7 right-11 h-14 w-24 rounded-full bg-white/12 rotate-[-12deg] ring-1 ring-white/20" aria-hidden />
          <span className="absolute bottom-12 left-7 size-14 rounded-2xl bg-white/10 rotate-12 ring-1 ring-white/15" aria-hidden />
          <svg className="absolute right-2 top-8 h-40 w-44 text-white/22 sm:right-7 sm:h-44 sm:w-52" viewBox="0 0 220 180" fill="none" aria-hidden>
            <path d="M42 122c22-34 50-51 84-51 26 0 47 10 65 31" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <path d="M84 62c6-21 19-34 40-38 16-3 31 0 44 10" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
            <path d="M56 133h111c12 0 22 10 22 22v2H34v-2c0-12 10-22 22-22Z" fill="currentColor" />
            <circle cx="68" cy="54" r="18" fill="currentColor" />
            <circle cx="167" cy="51" r="14" fill="currentColor" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/28 to-transparent" aria-hidden />
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close popup"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/18 p-2 text-white shadow-sm ring-1 ring-white/20 transition-colors hover:bg-white/28"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
          <span className="relative mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/18 shadow-sm ring-1 ring-white/25 backdrop-blur sm:size-14">
            <Gift className="size-6" strokeWidth={2.25} />
          </span>
          <h2 id="route-popup-title" className="relative max-w-[18rem] font-heading text-2xl font-semibold leading-tight tracking-tight drop-shadow-sm sm:max-w-md sm:text-3xl">
            {popup.title}
          </h2>
        </div>
        <div className="relative -mt-8 rounded-t-2xl bg-white px-5 pb-5 pt-9 sm:rounded-t-3xl sm:px-7 sm:pb-7 sm:pt-10">
          <p className="whitespace-pre-line text-[15px] leading-7 text-plum-600 sm:text-base sm:leading-8">
            {popup.message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closePopup}
              className="rounded-full px-5 py-3 text-sm font-extrabold text-plum-500 transition-colors hover:bg-plum-50"
            >
              Close
            </button>
            {ctaUrl && ctaLabel ? (
              external ? (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closePopup}
                  className="rounded-full bg-gradient-to-r from-coral-500 to-coral-600 px-6 py-3 text-center text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  {ctaLabel}
                </a>
              ) : (
                <Link
                  href={ctaUrl}
                  onClick={closePopup}
                  className="rounded-full bg-gradient-to-r from-coral-500 to-coral-600 px-6 py-3 text-center text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  {ctaLabel}
                </Link>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
