"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight, ImageOff, Loader2, X } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { apiFetch, STORE_API } from "@/lib/api";
import { SearchIcon } from "./Icons";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

function SearchBarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("search") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep the input in sync when the URL changes (back button, sidebar links…)
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  // Debounced live search
  useEffect(() => {
    const q = query.trim();
    abortRef.current?.abort();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setOpen(false);
      setLoading(false);
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
          setOpen(true);
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
  }, [query]);

  // Close the dropdown on outside click / Escape
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

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    // If we're on a filtered shop page, actually drop the search filter
    if (urlQuery) router.push("/shop");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (q) router.push(`/shop?search=${encodeURIComponent(q)}`);
    else clear();
  }

  return (
    <form ref={boxRef} onSubmit={submit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
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

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-xl shadow-plum-900/10">
          {results.length === 0 ? (
            <p className="p-4 text-center text-sm font-semibold text-plum-400">
              No products found for “{query.trim()}”
            </p>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => setOpen(false)}
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
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 border-t border-plum-100 bg-plum-50/50 py-2.5 text-xs font-extrabold text-coral-500 transition-colors hover:bg-plum-50"
              >
                See all results <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
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
