"use client";

const PAGE = "gedushop"; // facebook.com/gedushop → m.me/gedushop

/** Floating Messenger button — team is most active on Messenger. Bottom-left so it
 *  never collides with the cart dock / scroll-to-top on the right. */
export default function MessengerButton() {
  return (
    <a
      href={`https://m.me/${PAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Messenger"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white shadow-lg shadow-[#006AFF]/40 transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:size-14"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 md:size-8" aria-hidden>
        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.53-.04 1.03.28 2.12.44 3.2.44 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm6 7.46-2.94 4.66c-.47.74-1.47.93-2.18.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.18-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
      </svg>
    </a>
  );
}
