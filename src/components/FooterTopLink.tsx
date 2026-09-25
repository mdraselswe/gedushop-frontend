"use client";

import Link from "next/link";
import { useLayoutEffect } from "react";
import type { ComponentProps } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = Omit<ComponentProps<typeof Link>, "scroll" | "onNavigate">;

let footerNavigationPending = false;

function resetDocumentScroll() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Footer navigation always starts the destination at the real top of the page. */
export default function FooterTopLink({ children, ...props }: Props) {
  return (
    <Link
      {...props}
      scroll={false}
      onNavigate={() => {
        footerNavigationPending = true;
      }}
    >
      {children}
    </Link>
  );
}

/** Runs once after a footer-initiated route (or query) change is committed. */
export function FooterNavigationReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useLayoutEffect(() => {
    if (!footerNavigationPending) return;
    // Next applies its own restoration after child layout effects. Run on the
    // next frame so our explicit footer behavior wins before the new page is
    // painted, without a visible smooth-scroll journey through the document.
    const frame = requestAnimationFrame(() => {
      resetDocumentScroll();
      footerNavigationPending = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [routeKey]);

  return null;
}
