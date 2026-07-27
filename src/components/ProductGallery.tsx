"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, Minus, Play, Plus, X } from "lucide-react";
import ShareButton from "./ShareButton";
import type { StoreImage } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Extract a YouTube embed URL from any common YouTube link. */
function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

interface Props {
  images: StoreImage[];
  name: string;
  discount: number | null;
  slug?: string;
  video?: string;
}

export default function ProductGallery({ images, name, discount, slug, video }: Props) {
  const [index, setIndex] = useState(0);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const embed = youtubeEmbed(video);
  const hasVideo = !!embed;
  const slideCount = images.length + (hasVideo ? 1 : 0);
  const many = slideCount > 1;
  const isVideo = hasVideo && index >= images.length;
  const current = images[index]; // undefined on the video slide

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + slideCount) % slideCount),
    [slideCount],
  );

  if (images.length === 0 && !hasVideo) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-plum-100/60 bg-white">
        <ImageOff className="size-16 text-plum-200" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div>
      <div
        className={`group relative aspect-square overflow-hidden rounded-2xl border border-plum-100/60 bg-white ${
          isVideo ? "" : "cursor-zoom-in"
        }`}
        onMouseEnter={() => !isVideo && setHoverZoom(true)}
        onMouseLeave={() => setHoverZoom(false)}
        onMouseMove={(e) => {
          if (isVideo) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          swiped.current = false;
        }}
        onTouchMove={(e) => {
          if (touchStartX.current !== null && Math.abs(e.touches[0].clientX - touchStartX.current) > 10)
            swiped.current = true;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (many && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        onClick={() => {
          if (isVideo) return;
          if (swiped.current) {
            swiped.current = false;
            return; // it was a swipe, not a tap → don't open the lightbox
          }
          setLightbox(true);
        }}
      >
        {isVideo ? (
          <iframe
            src={embed!}
            title={`${name} video`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {/* Plain <img> with WP's responsive srcset: static export can't resize
                via next/image, so the browser picks a sized WebP for a fast LCP. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.src}
              srcSet={current.srcset}
              sizes={current.srcset ? "(max-width: 768px) 100vw, 50vw" : undefined}
              alt={current.alt || name}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-200"
              style={hoverZoom ? { transform: "scale(1.9)", transformOrigin: origin } : undefined}
            />
            <span className="absolute bottom-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
              <ShareButton title={name} slug={slug} />
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(true);
              }}
              aria-label="Open fullscreen zoom"
              className="absolute bottom-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-md backdrop-blur transition-colors hover:bg-plum-600 hover:text-white"
            >
              <Maximize2 className="size-4" strokeWidth={2.25} />
            </button>
          </>
        )}

        {discount && !isVideo && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-coral-500 px-3 py-1 text-xs font-extrabold text-white">
            -{discount}% OFF
          </span>
        )}

        {many && (
          <>
            <GalleryArrow dir={-1} onClick={(e) => { e.stopPropagation(); go(-1); }} />
            <GalleryArrow dir={1} onClick={(e) => { e.stopPropagation(); go(1); }} />
            {!isVideo && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full transition-all ${i === index ? "w-4 bg-plum-600" : "bg-plum-200"}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {many && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors ${
                i === index ? "border-coral-500" : "border-transparent hover:border-plum-200"
              }`}
            >
              <Image src={img.thumbnail || img.src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
          {hasVideo && (
            <button
              onClick={() => setIndex(images.length)}
              aria-label="Play product video"
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-plum-900 transition-colors ${
                isVideo ? "border-coral-500" : "border-transparent hover:border-plum-200"
              }`}
            >
              {images[0] && (
                <Image src={images[0].thumbnail || images[0].src} alt="" fill sizes="64px" className="object-cover opacity-50" />
              )}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-plum-700">
                  <Play className="size-3.5 fill-current" strokeWidth={0} />
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {lightbox && !isVideo && (
        <Lightbox images={images} name={name} index={index} setIndex={setIndex} onClose={() => setLightbox(false)} />
      )}
    </div>
  );
}

function GalleryArrow({ dir, onClick }: { dir: 1 | -1; onClick: (e: React.MouseEvent) => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      onClick={onClick}
      aria-label={dir === 1 ? "Next image" : "Previous image"}
      className={`absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-md backdrop-blur transition-all hover:bg-plum-600 hover:text-white ${
        dir === 1 ? "right-3" : "left-3"
      } md:opacity-0 md:group-hover:opacity-100`}
    >
      <Icon className="size-5" strokeWidth={2.5} />
    </button>
  );
}

function Lightbox({
  images,
  name,
  index,
  setIndex,
  onClose,
}: {
  images: StoreImage[];
  name: string;
  index: number;
  setIndex: (updater: (i: number) => number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const swipeX = useRef<number | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const step = useCallback(
    (delta: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)))),
    [],
  );

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
      reset();
    },
    [images.length, reset, setIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "+" || e.key === "=") step(0.5);
      if (e.key === "-") step(-0.5);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      // restore whatever was there (quick view may still be holding the lock)
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose, step]);

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const btn =
    "flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 disabled:opacity-40";

  return (
    <div data-lightbox className="fixed inset-0 z-[70] flex flex-col bg-plum-900/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${name} images`}>
      <div className="flex items-center justify-between p-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
          {index + 1} / {images.length}
        </span>
        <div className="flex gap-2">
          <button onClick={() => step(-0.5)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" className={btn}>
            <Minus className="size-5" strokeWidth={2.5} />
          </button>
          <span className="flex h-10 min-w-14 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => step(0.5)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" className={btn}>
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
          <button onClick={onClose} aria-label="Close" className={btn}>
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        className={`relative flex-1 select-none overflow-hidden ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onDoubleClick={() => (zoom > 1 ? reset() : setZoom(2))}
        onWheel={(e) => step(e.deltaY < 0 ? 0.25 : -0.25)}
        onPointerDown={(e) => {
          if (zoom === 1) {
            swipeX.current = e.clientX; // not zoomed → track a swipe to change image
            return;
          }
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPan({ x: drag.current.panX + e.clientX - drag.current.x, y: drag.current.panY + e.clientY - drag.current.y });
        }}
        onPointerUp={(e) => {
          if (zoom === 1 && swipeX.current !== null && images.length > 1) {
            const dx = e.clientX - swipeX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }
          swipeX.current = null;
          drag.current = null;
        }}
      >
        {/* plain <img>: next/image optimization caps large zoomed renders */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index].src}
          alt={images[index].alt || name}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform duration-150"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-4 p-3">
          <button onClick={() => go(-1)} aria-label="Previous image" className={btn}>
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>
          <div className="no-scrollbar flex max-w-[60vw] gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => {
                  setIndex(() => i);
                  reset();
                }}
                aria-label={`Image ${i + 1}`}
                className={`relative size-12 shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === index ? "border-coral-400" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.thumbnail || img.src} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
          <button onClick={() => go(1)} aria-label="Next image" className={btn}>
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
