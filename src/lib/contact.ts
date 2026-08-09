/**
 * The one place the shop's phone number lives.
 *
 * It was written out separately in the footer, the contact page and the
 * structured data, and adding a fourth copy to the header is how a number
 * changes in three places and stays wrong in the fourth — on the search
 * result, which is the copy nobody thinks to check.
 */
export const PHONE = "+8801552958606";

/** Grouped for reading, not for dialling — `tel:` gets PHONE. */
export const PHONE_DISPLAY = "+880 1552-958606";

/** wa.me wants the number bare: no plus, no spaces. */
export const WHATSAPP = "8801552958606";
