/** Bangladesh districts with WooCommerce state codes (BD:xx). Dhaka = BD-13
 *  drives the "Dhaka" shipping zone; every other district falls to "Outside Dhaka". */
export interface District {
  code: string;
  name: string;
}

export const DHAKA_CODE = "BD-13";

/** The one area of the Dhaka district that is inside the city, for delivery. */
export const DHAKA_SADAR = "Dhaka Sadar";

/**
 * The Dhaka district's areas, as the couriers divide it.
 *
 * Dhaka *district* is not Dhaka *city*: Dhaka Sadar is the city itself, and
 * the five below it are outlying upazilas that cost the same to reach as any
 * other district. So only Dhaka Sadar is charged the inside-Dhaka rate — the
 * rest take the outside rate, even though they share the BD-13 state code.
 * WooCommerce prices a zone from the state alone, so the rule is enforced on
 * the WordPress side (the GeduShop Delivery Areas plugin); this list is only
 * what the customer picks from.
 */
export const DHAKA_AREAS: string[] = [
  DHAKA_SADAR,
  "Savar",
  "Dhamrai",
  "Keraniganj",
  "Nawabganj",
  "Dohar",
];

export const DISTRICTS: District[] = [
  { code: "BD-05", name: "Bagerhat" },
  { code: "BD-01", name: "Bandarban" },
  { code: "BD-02", name: "Barguna" },
  { code: "BD-06", name: "Barishal" },
  { code: "BD-07", name: "Bhola" },
  { code: "BD-03", name: "Bogura" },
  { code: "BD-04", name: "Brahmanbaria" },
  { code: "BD-09", name: "Chandpur" },
  { code: "BD-10", name: "Chattogram" },
  { code: "BD-12", name: "Chuadanga" },
  { code: "BD-11", name: "Cox's Bazar" },
  { code: "BD-08", name: "Cumilla" },
  { code: "BD-13", name: "Dhaka" },
  { code: "BD-14", name: "Dinajpur" },
  { code: "BD-15", name: "Faridpur" },
  { code: "BD-16", name: "Feni" },
  { code: "BD-19", name: "Gaibandha" },
  { code: "BD-18", name: "Gazipur" },
  { code: "BD-17", name: "Gopalganj" },
  { code: "BD-20", name: "Habiganj" },
  { code: "BD-21", name: "Jamalpur" },
  { code: "BD-22", name: "Jashore" },
  { code: "BD-25", name: "Jhalokati" },
  { code: "BD-23", name: "Jhenaidah" },
  { code: "BD-24", name: "Joypurhat" },
  { code: "BD-29", name: "Khagrachhari" },
  { code: "BD-27", name: "Khulna" },
  { code: "BD-26", name: "Kishoreganj" },
  { code: "BD-28", name: "Kurigram" },
  { code: "BD-30", name: "Kushtia" },
  { code: "BD-31", name: "Lakshmipur" },
  { code: "BD-32", name: "Lalmonirhat" },
  { code: "BD-36", name: "Madaripur" },
  { code: "BD-37", name: "Magura" },
  { code: "BD-33", name: "Manikganj" },
  { code: "BD-39", name: "Meherpur" },
  { code: "BD-38", name: "Moulvibazar" },
  { code: "BD-35", name: "Munshiganj" },
  { code: "BD-34", name: "Mymensingh" },
  { code: "BD-48", name: "Naogaon" },
  { code: "BD-43", name: "Narail" },
  { code: "BD-40", name: "Narayanganj" },
  { code: "BD-42", name: "Narsingdi" },
  { code: "BD-44", name: "Natore" },
  { code: "BD-45", name: "Nawabganj" },
  { code: "BD-41", name: "Netrakona" },
  { code: "BD-46", name: "Nilphamari" },
  { code: "BD-47", name: "Noakhali" },
  { code: "BD-49", name: "Pabna" },
  { code: "BD-52", name: "Panchagarh" },
  { code: "BD-51", name: "Patuakhali" },
  { code: "BD-50", name: "Pirojpur" },
  { code: "BD-53", name: "Rajbari" },
  { code: "BD-54", name: "Rajshahi" },
  { code: "BD-56", name: "Rangamati" },
  { code: "BD-55", name: "Rangpur" },
  { code: "BD-58", name: "Satkhira" },
  { code: "BD-62", name: "Shariatpur" },
  { code: "BD-57", name: "Sherpur" },
  { code: "BD-59", name: "Sirajganj" },
  { code: "BD-61", name: "Sunamganj" },
  { code: "BD-60", name: "Sylhet" },
  { code: "BD-63", name: "Tangail" },
  { code: "BD-64", name: "Thakurgaon" },
];
