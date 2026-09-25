"use client";

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
}

export const CONSENT_KEY = "gedu_cookie_consent";
export const CONSENT_CHANGED = "gedu:cookie-consent-changed";
export const CONSENT_OPEN = "gedu:cookie-consent-open";

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    if (!raw || typeof raw !== "object") return null;
    return {
      necessary: true,
      analytics: raw.analytics === true,
      marketing: raw.marketing === true,
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveConsent(input: Pick<ConsentState, "analytics" | "marketing">) {
  if (typeof window === "undefined") return;
  const next: ConsentState = {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: next }));
}

export function hasAnalyticsConsent() {
  return readConsent()?.analytics === true;
}

export function hasMarketingConsent() {
  return readConsent()?.marketing === true;
}
