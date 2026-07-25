"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch, GEDU_API } from "@/lib/api";

interface Announcement {
  enabled: boolean;
  id?: string;
  message?: string;
  link?: string;
}

const DISMISS_KEY = "gedu_ann_dismissed";

/**
 * Thin top announcement bar. Content comes from WP (Settings → Announcement)
 * over REST, read client-side so on/off is instant with no rebuild. Dismissible
 * per-message: closing hides it until the message text changes.
 */
export default function AnnouncementBar() {
  const [ann, setAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${GEDU_API}/announcement`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Announcement | null) => {
        if (cancelled || !data?.enabled) return;
        if (localStorage.getItem(DISMISS_KEY) === data.id) return; // already dismissed
        setAnn(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ann?.enabled || !ann.message) return null;

  const dismiss = () => {
    if (ann.id) localStorage.setItem(DISMISS_KEY, ann.id);
    setAnn(null);
  };

  const label = (
    <>
      {ann.message}
      {ann.link && <span aria-hidden> →</span>}
    </>
  );
  const linkCls = "flex-1 text-center text-xs font-bold hover:underline sm:text-sm";
  const external = !!ann.link && /^https?:\/\//i.test(ann.link);

  return (
    <div className="relative z-50 bg-gradient-to-r from-plum-600 to-coral-500 text-white">
      <div className="mx-auto flex max-w-[120rem] items-center gap-2 px-4 py-2">
        {ann.link ? (
          external ? (
            <a href={ann.link} target="_blank" rel="noopener noreferrer" className={linkCls}>
              {label}
            </a>
          ) : (
            <Link href={ann.link} className={linkCls}>
              {label}
            </Link>
          )
        ) : (
          <span className="flex-1 text-center text-xs font-bold sm:text-sm">{ann.message}</span>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
