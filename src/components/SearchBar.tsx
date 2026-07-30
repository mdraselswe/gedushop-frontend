"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Clock, ImageOff, Loader2, X } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { apiFetch, STORE_API } from "@/lib/api";
import { SearchIcon } from "./Icons";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

/* ---- Recent searches (localStorage) ---- */
const HISTORY_KEY = "gedu_search_history";
const HISTORY_MAX = 8;

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveHistory(list: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {
    // storage unavailable — history just won't persist
  }
}

function SearchBarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("search") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [open, setOpen] = useState(false); // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // full-screen overlay
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const boxRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setHistory(getHistory()), []);

  const remember = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < MIN_CHARS) return;
    setHistory((h) => {
      const next = [t, ...h.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX);
      saveHistory(next);
      return next;
    });
  }, []);

  const forget = useCallback((term: string) => {
    setHistory((h) => {
      const next = h.filter((x) => x !== term);
      saveHistory(next);
      return next;
    });
  }, []);

  // Keep the input in sync when the URL changes (back button, sidebar links…)
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  // Debounced live search
  useEffect(() => {
    const q = query.trim();
    abortRef.current?.abort();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      // keep the dropdown open — it shows recent searches when the query is empty
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`${STORE_API}/products?search=${encodeURIComponent(q)}&per_page=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setResults(await res.json());
          if (!mobileOpen) setOpen(true);
        }
      } catch {
        // aborted or offline — keep whatever we had
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, mobileOpen]);

  // Close the desktop dropdown on outside click / Escape
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Overlay: scroll lock + autofocus + Escape
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => mobileInputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const closeAll = useCallback(() => {
    setOpen(false);
    setMobileOpen(false);
  }, []);

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    // If we're on a filtered shop page, actually drop the search filter
    if (urlQuery) router.push("/shop");
  }

  function goToAll() {
    const q = query.trim();
    closeAll();
    if (q) {
      remember(q);
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      clear();
    }
  }

  function searchTerm(term: string) {
    setQuery(term);
    remember(term);
    closeAll();
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    goToAll();
  }

  const resultsList =
    results.length === 0 ? (
      <p className="p-4 text-center text-sm font-semibold text-plum-400">
        No products found for “{query.trim()}”
      </p>
    ) : (
      <>
        <ul className="overflow-y-auto md:max-h-80">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/product/${p.slug}`}
                onClick={() => {
                  remember(query);
                  closeAll();
                }}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-plum-50"
              >
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-plum-50">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].thumbnail || p.images[0].src}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <ImageOff className="size-4 text-plum-200" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold text-plum-800">{decodeEntities(p.name)}</span>
                  <span className="text-xs font-extrabold text-plum-500">
                    {formatPrice(p.prices.price, p.prices)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={goToAll}
          className="flex w-full items-center justify-center gap-1.5 border-t border-plum-100 bg-plum-50/50 py-2.5 text-xs font-extrabold text-coral-500 transition-colors hover:bg-plum-50"
        >
          See all results <ArrowRight className="size-3.5" strokeWidth={2.5} />
        </button>
      </>
    );

  const historyList =
    history.length === 0 ? null : (
      <div className="py-1">
        <div className="flex items-center justify-between px-4 pb-1 pt-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-plum-300">Recent searches</span>
          <button
            type="button"
            onClick={() => {
              setHistory([]);
              saveHistory([]);
            }}
            className="text-[11px] font-bold text-plum-400 hover:text-coral-500"
          >
            Clear all
          </button>
        </div>
        <ul>
          {history.map((h) => (
            <li key={h} className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-plum-50">
              <Clock className="size-4 shrink-0 text-plum-300" strokeWidth={2.25} />
              <button
                type="button"
                onClick={() => searchTerm(h)}
                className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-plum-700"
              >
                {h}
              </button>
              <button
                type="button"
                onClick={() => forget(h)}
                aria-label={`Remove ${h} from history`}
                className="shrink-0 rounded-full p-1 text-plum-300 hover:text-coral-500"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <form ref={boxRef} onSubmit={submit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={(e) => {
          // Mobile: hand over to the full-screen overlay for comfortable typing
          if (window.innerWidth < 768) {
            e.target.blur();
            setMobileOpen(true);
            return;
          }
          if (results.length > 0 || (query.trim().length < MIN_CHARS && history.length > 0)) setOpen(true);
        }}
        placeholder="Search toys, baby items…"
        className="w-full rounded-full border border-plum-100 bg-white py-2.5 pl-4 pr-16 text-sm text-plum-800 placeholder:text-plum-300 shadow-sm outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
      />

      {query && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-plum-300 transition-colors hover:text-plum-600"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      )}

      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-plum-600 p-2 text-white transition-colors hover:bg-plum-700"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <SearchIcon className="size-4" />}
      </button>

      {/* Desktop dropdown: live results, or recent searches while the box is empty */}
      {open && !mobileOpen && (query.trim().length >= MIN_CHARS || history.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 hidden overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-xl shadow-plum-900/10 md:block">
          {query.trim().length >= MIN_CHARS ? resultsList : historyList}
        </div>
      )}

      {/* Mobile full-screen search overlay */}
      {mobileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex flex-col bg-white md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="flex items-center gap-2 border-b border-plum-100 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close search"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-plum-600 hover:bg-plum-50"
              >
                <ArrowLeft className="size-5" strokeWidth={2.25} />
              </button>
              <div className="relative flex-1">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      goToAll();
                    }
                  }}
                  placeholder="Search toys, baby items…"
                  className="w-full rounded-full border border-plum-100 bg-plum-50/50 py-2.5 pl-4 pr-10 text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-plum-300"
                  >
                    <X className="size-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-8">
              {loading && (
                <div className="flex justify-center pt-8">
                  <Loader2 className="size-6 animate-spin text-plum-300" />
                </div>
              )}
              {!loading && query.trim().length >= MIN_CHARS && resultsList}
              {!loading &&
                query.trim().length < MIN_CHARS &&
                (historyList ?? (
                  <p className="pt-10 text-center text-sm font-semibold text-plum-300">Type to search products…</p>
                ))}
            </div>
          </div>,
          document.body,
        )}
    </form>
  );
}

export default function SearchBar() {
  return (
    <Suspense fallback={<div className="h-10 w-full rounded-full bg-white" />}>
      <SearchBarInner />
    </Suspense>
  );
}
