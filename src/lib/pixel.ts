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
const pending: [
  event: string,
  params: Record<string, unknown> | undefined,
  eventID: string | undefined,
][] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Stop waiting eventually: an ad blocker will never let fbevents.js load, and
// a page-view event delivered half a minute late is noise, not data.
const MAX_WAIT_MS = 10_000;
const POLL_MS = 200;

function getFbq(): Fbq | undefined {
  return (window as unknown as { fbq?: Fbq }).fbq;
}

/**
 * fbq's 4th argument carries the deduplication key. It must be omitted rather
 * than passed as undefined — fbq treats a present-but-empty options object as a
 * real one and logs a warning.
 */
function send(fbq: Fbq, event: string, params?: Record<string, unknown>, eventID?: string) {
  if (eventID) fbq("track", event, params, { eventID });
  else fbq("track", event, params);
}

/** Drain the backlog in order. Returns false while the pixel is still absent. */
function flush(): boolean {
  const fbq = getFbq();
  if (!fbq) return false;
  for (const [event, params, eventID] of pending.splice(0)) send(fbq, event, params, eventID);
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

/**
 * `eventID` is Meta's deduplication key. Meta drops a repeat of the same
 * (event name, eventID) pair for 48 hours, across both the browser pixel and
 * the Conversions API. Pass a stable, order-derived id for anything that must
 * only ever count once — without it a page refresh is a second conversion, and
 * a server-side integration sending the same purchase is a third.
 */
export function fbTrack(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (typeof window === "undefined") return;
  const fbq = getFbq();
  if (fbq) {
    send(fbq, event, params, eventID);
    return;
  }
  pending.push([event, params, eventID]);
  scheduleFlush();
}
