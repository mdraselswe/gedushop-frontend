"use client";

import { CONSENT_OPEN } from "@/lib/consent";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN))}
      className="transition-colors hover:text-coral-300"
    >
      Cookies
    </button>
  );
}
