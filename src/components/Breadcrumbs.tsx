import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs font-semibold text-plum-400">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {c.href && !last ? (
              <Link href={c.href} className="hover:text-coral-500">{c.label}</Link>
            ) : (
              <span className={last ? "line-clamp-1 max-w-[60vw] text-plum-600" : ""}>{c.label}</span>
            )}
            {!last && <ChevronRight className="size-3.5 text-plum-300" strokeWidth={2.5} />}
          </span>
        );
      })}
    </nav>
  );
}
