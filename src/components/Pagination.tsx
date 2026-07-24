import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  current: number;
  totalPages: number;
  /** Query params to preserve while switching pages (search, category…) */
  baseParams: Record<string, string | undefined>;
}

function pageHref(baseParams: Props["baseParams"], page: number) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(baseParams)) if (v) q.set(k, v);
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default function Pagination({ current, totalPages, baseParams }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - current) <= 1,
  );

  const btn = "flex size-9 items-center justify-center rounded-full text-sm font-extrabold transition-colors";

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      {current > 1 && (
        <Link href={pageHref(baseParams, current - 1)} aria-label="Previous page" className={`${btn} bg-white text-plum-600 border border-plum-100 hover:border-plum-300`}>
          <ChevronLeft className="size-4" strokeWidth={2.5} />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-plum-300">…</span>}
          <Link
            href={pageHref(baseParams, p)}
            aria-current={p === current ? "page" : undefined}
            className={`${btn} ${
              p === current
                ? "bg-plum-600 text-white"
                : "bg-white text-plum-600 border border-plum-100 hover:border-plum-300"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
      {current < totalPages && (
        <Link href={pageHref(baseParams, current + 1)} aria-label="Next page" className={`${btn} bg-white text-plum-600 border border-plum-100 hover:border-plum-300`}>
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </Link>
      )}
    </nav>
  );
}
