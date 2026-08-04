/** Fire a Meta (Facebook) Pixel standard event, safely (no-op if pixel absent). */
type Fbq = (...args: unknown[]) => void;

/**
 * Events fired before the pixel snippet has run.
 *
 * These used to be dropped silently. ViewContent suffered worst: it fires from
 * an effect on mount, which on an image-heavy product page beat the pixel
 * script often enough that a real share of product views never reached Meta —
 * with nothing in the console to say so. Hold them instead, and flush once fbq
 * appears.
 */
const pending: [event: string, params: Record<string, unknown> | undefined][] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Stop waiting eventually: an ad blocker will never let fbevents.js load, and
// a page-view event delivered half a minute late is noise, not data.
const MAX_WAIT_MS = 10_000;
const POLL_MS = 200;

function getFbq(): Fbq | undefined {
  return (window as unknown as { fbq?: Fbq }).fbq;
}

/** Drain the backlog in order. Returns false while the pixel is still absent. */
function flush(): boolean {
  const fbq = getFbq();
  if (!fbq) return false;
  for (const [event, params] of pending.splice(0)) fbq("track", event, params);
  return true;
}

function scheduleFlush() {
  if (flushTimer) return;
  const started = Date.now();
  flushTimer = setInterval(() => {
    if (flush() || Date.now() - started > MAX_WAIT_MS) {
      clearInterval(flushTimer!);
      flushTimer = null;
      pending.length = 0; // gave up — drop the backlog rather than grow it
    }
  }, POLL_MS);
}

export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = getFbq();
  if (fbq) {
    fbq("track", event, params);
    return;
  }
  pending.push([event, params]);
  scheduleFlush();
}
