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
  delayMs?: number;
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
  const [readyPopupKey, setReadyPopupKey] = useState<string | null>(null);

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
  const popupKey = popup ? `${popup.id}:${pathname}` : null;

  useEffect(() => {
    if (!popup || !popupKey) return;

    const delay = Math.max(0, Math.min(Number(popup.delayMs) || 0, 2147483647));
    const timer = window.setTimeout(() => {
      setReadyPopupKey(popupKey);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [popup, popupKey]);

  useEffect(() => {
    if (!popup || readyPopupKey !== popupKey) return;
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
  }, [popup?.id, popupKey, readyPopupKey]);

  if (!popup || readyPopupKey !== popupKey) return null;

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
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_rgba(34,28,54,0.38)] ring-1 ring-white/80 sm:rounded-[1.35rem]">
        <div className="relative min-h-44 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.28),transparent_22%),radial-gradient(circle_at_18%_88%,rgba(250,197,193,0.34),transparent_32%),linear-gradient(135deg,#221c36_0%,#4f4274_52%,#e96d65_100%)] px-5 pb-12 pt-5 text-white sm:min-h-52 sm:px-7 sm:pt-7">
          <span className="absolute -right-10 -top-10 size-44 rounded-full bg-white/12 blur-sm" aria-hidden />
          <span className="absolute right-10 top-20 size-24 rounded-[1.5rem] bg-coral-200/20 rotate-12 ring-1 ring-white/18" aria-hidden />
          <span className="absolute bottom-5 left-6 size-16 rounded-2xl bg-white/10 -rotate-12 ring-1 ring-white/15" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-plum-950/55 via-plum-950/18 to-transparent" aria-hidden />
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
          <div className="relative max-w-[22rem] rounded-2xl bg-plum-950/28 p-3 ring-1 ring-white/16 backdrop-blur-sm sm:max-w-md sm:p-4">
            <h2 id="route-popup-title" className="font-heading text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl">
              {popup.title}
            </h2>
          </div>
        </div>
        <div className="relative -mt-6 rounded-t-2xl bg-white px-5 pb-5 pt-9 sm:rounded-t-[1.35rem] sm:px-7 sm:pb-7 sm:pt-10">
          <p className="whitespace-pre-line text-[15px] font-semibold leading-7 text-plum-700 sm:text-base sm:leading-8">
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
