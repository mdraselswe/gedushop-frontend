/** Fire a Meta (Facebook) Pixel standard event, safely (no-op if pixel absent). */
type Fbq = (...args: unknown[]) => void;

export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params);
}
