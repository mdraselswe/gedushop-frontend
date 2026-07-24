"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades/slides its children up when scrolled into view. `index` staggers the
 * delay so grids cascade in. Pure IntersectionObserver — no animation library.
 */
export default function Reveal({
  children,
  index = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  as?: React.ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
