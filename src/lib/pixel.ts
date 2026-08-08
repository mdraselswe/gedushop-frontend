/** Fire a Meta (Facebook) Pixel standard event, safely (no-op if pixel absent). */
type Fbq = (...args: unknown[]) => void;

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

/**
 * Calls made before the pixel snippet has run.
 *
 * These used to be dropped silently. ViewContent suffered worst: it fires from
 * an effect on mount, which on an image-heavy product page beat the pixel
 * script often enough that a real share of product views never reached Meta —
 * with nothing in the console to say so. Hold them instead, and flush once fbq
 * appears.
 *
 * Held as thunks rather than event tuples so that advanced-matching `init`
 * calls queue alongside `track` calls and keep their order: identifiers set
 * after the event they were meant to describe are worthless.
 */
const pending: ((fbq: Fbq) => void)[] = [];
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
  for (const run of pending.splice(0)) run(fbq);
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

function enqueue(run: (fbq: Fbq) => void) {
  if (typeof window === "undefined") return;
  const fbq = getFbq();
  if (fbq) {
    run(fbq);
    return;
  }
  pending.push(run);
  scheduleFlush();
}

/**
 * `eventID` is Meta's deduplication key. Meta drops a repeat of the same
 * (event name, eventID) pair for 48 hours, across both the browser pixel and
 * the Conversions API. Pass a stable, order-derived id for anything that must
 * only ever count once — without it a page refresh is a second conversion, and
 * a server-side integration sending the same purchase is a third.
 */
export function fbTrack(event: string, params?: Record<string, unknown>, eventID?: string) {
  // fbq's 4th argument must be omitted rather than passed as undefined — fbq
  // treats a present-but-empty options object as a real one and warns.
  enqueue((fbq) =>
    eventID ? fbq("track", event, params, { eventID }) : fbq("track", event, params),
  );
}

/**
 * Bangladeshi mobile numbers are entered as `01XXXXXXXXX`. Meta wants digits
 * only, country code included, no leading plus.
 */
function normalisePhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^8801\d{9}$/.test(digits)) return digits;
  return digits.length >= 10 ? digits : undefined;
}

/**
 * Attach customer identifiers to everything the pixel sends from here on —
 * Meta calls this Advanced Matching, and it is what lets a conversion be tied
 * to a person Meta already recognises. Without it the dataset's Event Match
 * Quality sat at 6.1/10.
 *
 * Only what checkout already collects is sent: phone, and first/last name.
 * fbevents.js normalises and SHA-256 hashes each field in the browser, so the
 * raw values never leave the device — but they are still personal data, so
 * nothing is sent until an order has actually been placed.
 *
 * Re-calling `init` with the same pixel id is Meta's documented way to supply
 * these; it augments the existing pixel rather than creating a second one.
 */
export function fbSetUserData(user: { name?: string; phone?: string }) {
  if (typeof window === "undefined" || !PIXEL_ID) return;

  const data: Record<string, string> = {};

  const phone = user.phone ? normalisePhone(user.phone) : undefined;
  if (phone) data.ph = phone;

  const parts = (user.name ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length) {
    data.fn = parts[0];
    // Single-word names are common here; a surname copied from the given name
    // would be a false identifier, so send only what was actually given.
    if (parts.length > 1) data.ln = parts[parts.length - 1];
  }

  if (!Object.keys(data).length) return;
  data.country = "bd";

  enqueue((fbq) => fbq("init", PIXEL_ID, data));
}
