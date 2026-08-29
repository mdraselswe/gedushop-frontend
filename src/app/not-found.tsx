"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PackageX } from "lucide-react";
import ProductFallback from "@/components/ProductFallback";

/**
 * The 404 page, which is also the front door for products this build predates.
 *
 * A static export has one HTML file per product, written at build time, while
 * the listing pages fetch live. Between publishing a product and the next
 * build, the shop lists something whose page does not exist — so before showing
 * anybody "page not found", check whether the address names a real product and
 * render it if it does. See ProductFallback.
 */
export default function NotFound() {
  const [showNotFound, setShowNotFound] = useState(false);
  const [isProductUrl, setIsProductUrl] = useState<boolean | null>(null);

  useEffect(() => {
    setIsProductUrl(/^\/product\/[^/]+\/?$/.test(window.location.pathname));
  }, []);

  const onMiss = useCallback(() => setShowNotFound(true), []);

  // Nothing until the path is known: rendering "page not found" for a split
  // second before a product appears is worse than rendering nothing.
  if (isProductUrl === null) return null;
  if (isProductUrl && !showNotFound) return <ProductFallback onMiss={onMiss} />;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-plum-50">
        <PackageX className="size-10 text-plum-300" strokeWidth={1.75} />
      </span>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-plum-700">Page not found</h1>
      <p className="mt-2 text-sm text-plum-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-plum-200 px-6 py-2.5 text-sm font-extrabold text-plum-600 hover:bg-plum-50"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
