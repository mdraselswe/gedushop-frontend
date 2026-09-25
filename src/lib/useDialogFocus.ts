"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  '[data-dialog-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus the dialog, contain Tab navigation, then return focus to its trigger. */
export function useDialogFocus<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      const root = ref.current;
      if (!root) return;
      (root.querySelector<HTMLElement>(FOCUSABLE) ?? root).focus();
    });

    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.getClientRects().length > 0,
      );
      if (!items.length) {
        event.preventDefault();
        ref.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapTab);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trapTab);
      previouslyFocused?.focus();
    };
  }, [open]);

  return ref;
}
