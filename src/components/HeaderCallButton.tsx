import { Phone } from "lucide-react";
import { PHONE, PHONE_DISPLAY } from "@/lib/contact";

/**
 * Call-to-order, in the header.
 *
 * The number was only ever in the footer and on the contact page — three
 * scrolls and a page load away from the product somebody had a question
 * about. For a shop this size the phone closes sales the cart doesn't, so it
 * belongs where the cart is.
 *
 * Two shapes rather than one that fits badly. On a wide screen there is room
 * to show the digits, and a number you can read is worth more than a button
 * you have to trust — people dial from a second phone, or note it down. On a
 * narrow one the header row is already logo, search, wishlist and cart, so it
 * shrinks to the same round icon those two use and lets `tel:` do the work,
 * which is what a phone will do with it anyway.
 */
export default function HeaderCallButton() {
  return (
    <a
      href={`tel:${PHONE}`}
      aria-label={`Call to order: ${PHONE_DISPLAY}`}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-coral-500 transition-colors hover:bg-coral-50 md:size-auto md:gap-2.5 md:rounded-2xl md:border md:border-coral-100 md:bg-coral-50 md:px-3 md:py-1.5 md:hover:border-coral-200 md:hover:bg-coral-100"
    >
      <Phone className="size-5 md:size-4" strokeWidth={2.25} />
      {/* Hidden rather than absent on mobile: one element, so the number can
          never say two different things on two screen sizes. */}
      <span className="hidden text-left leading-tight md:block">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-coral-600/80">
          Call to order
        </span>
        <span className="block text-sm font-extrabold tabular-nums text-plum-700">
          {PHONE_DISPLAY}
        </span>
      </span>
    </a>
  );
}
