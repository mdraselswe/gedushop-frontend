"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 4500;

interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  bg: string;
  image: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  {
    title: "Everything your little one needs",
    subtitle: "Toys, baby care & more — delivered to your door",
    cta: "Shop Now",
    bg: "from-plum-600 to-plum-400",
    image: "/carousel/baby-toys-natural.jpg",
    imageAlt: "Pastel baby toys and teddy bear",
  },
  {
    title: "Cash on Delivery",
    subtitle: "Order now, pay when it arrives — all over Bangladesh",
    cta: "Start Shopping",
    bg: "from-coral-500 to-coral-300",
    image: "/carousel/cash-on-delivery-natural.jpg",
    imageAlt: "Cash on delivery for baby products",
  },
  {
    title: "New toys every week",
    subtitle: "Fresh fun for every age group",
    cta: "Explore Toys",
    bg: "from-plum-500 to-coral-400",
    image: "/carousel/new-toys-natural.jpg",
    imageAlt: "New toys arriving in a gift box",
  },
];

export default function BannerSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  // Real number of scroll pages — depends on how many cards fit at once, so it
  // adapts to screen size (fewer pages on wide screens where 2 cards show).
  const [pageCount, setPageCount] = useState(SLIDES.length);
  const paused = useRef(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return SLIDES.length;
    const n = Math.max(1, Math.ceil((track.scrollWidth - 2) / track.clientWidth));
    setPageCount(n);
    return n;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  // Scroll to a page (one viewport-width step). Browser clamps to max scroll.
  const scrollTo = useCallback((p: number, count = pageCount) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, p));
    setPage(clamped);
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }, [pageCount]);

  const go = useCallback((dir: 1 | -1) => scrollTo(page + dir), [page, scrollTo]);

  // Keep the active dot in sync when the user swipes/drags manually.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      const last = Math.max(1, Math.ceil((track.scrollWidth - 2) / track.clientWidth)) - 1;
      if (max > 0 && track.scrollLeft >= max - 2) {
        setPage(last);
        return;
      }
      setPage(Math.min(last, Math.round(track.scrollLeft / track.clientWidth)));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // Autoplay — loops through pages, pauses on hover/touch.
  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) scrollTo((page + 1) % pageCount);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [page, pageCount, scrollTo]);

  const arrowBase =
    "absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-md backdrop-blur transition-colors hover:bg-plum-600 hover:text-white md:flex md:opacity-0 md:group-hover:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-plum-50 disabled:text-plum-300 disabled:shadow-none disabled:hover:bg-plum-50 disabled:hover:text-plum-300";

  return (
    <div
      className="group relative"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
    >
      <div
        ref={trackRef}
        className="no-scrollbar -mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 md:mr-0"
      >
        {SLIDES.map(({ title, subtitle, cta, bg, image, imageAlt }) => (
          <a
            key={title}
            href="/shop"
            className={`grain relative flex w-[88%] shrink-0 snap-start items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br ${bg} p-6 text-white md:w-[46%] md:p-8`}
          >
            <span
              className="pointer-events-none absolute inset-y-0 right-0 w-[62%] overflow-hidden md:w-[58%]"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.75) 34%, black 58%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,.75) 34%, black 58%)",
              }}
            >
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width: 768px) 28vw, 55vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </span>
            {/* soft radial highlight for depth */}
            <span className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <div className="relative z-10 max-w-[68%]">
              <h2 className="font-heading text-xl font-semibold leading-[1.15] tracking-tight md:text-3xl">{title}</h2>
              <p className="mt-1.5 max-w-[26ch] text-xs opacity-90 md:text-sm">{subtitle}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-extrabold text-plum-700 shadow-sm transition-transform group-hover:scale-105 md:text-sm">
                {cta}
                <span aria-hidden>→</span>
              </span>
            </div>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          go(-1);
        }}
        disabled={page === 0}
        aria-label="Previous banner"
        className={`left-1 ${arrowBase}`}
      >
        <ChevronLeft className="size-5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          go(1);
        }}
        disabled={page >= pageCount - 1}
        aria-label="Next banner"
        className={`right-1 ${arrowBase}`}
      >
        <ChevronRight className="size-5" strokeWidth={2.5} />
      </button>

      <div className="mt-2 flex justify-center gap-1.5">
        {Array.from({ length: pageCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollTo(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === page ? "w-5 bg-plum-600" : "w-1.5 bg-plum-200 hover:bg-plum-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
