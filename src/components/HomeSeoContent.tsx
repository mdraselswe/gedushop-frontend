import Link from "next/link";

const categories = [
  { href: "/category/toys/", label: "Kids toys", text: "play, activity and pretend-play choices" },
  { href: "/category/education/", label: "Educational toys", text: "learning tools for curious young minds" },
  { href: "/category/feeding-nursing/", label: "Feeding essentials", text: "bowls, bottles and everyday feeding helpers" },
  { href: "/category/nursery-bedding/", label: "Nursery & bedding", text: "sleep and nursery essentials for babies" },
];

export default function HomeSeoContent() {
  return (
    <section className="fancy-surface relative overflow-hidden rounded-[1.75rem] p-5 md:p-7">
      <span aria-hidden className="absolute -right-12 -top-16 size-44 rounded-full bg-coral-100/45 blur-3xl" />
      <span className="section-kicker">Shop with confidence</span>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-plum-800 md:text-2xl">
        Baby and kids shopping made easier
      </h2>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-plum-500">
        GeduShop brings together practical baby products, kids toys and everyday essentials for families in
        Bangladesh. Compare clear product details and prices, order from home, and pay by cash on delivery anywhere
        in the country.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group rounded-xl border border-plum-100/70 bg-white/75 p-4 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-coral-200 hover:bg-white"
          >
            <h3 className="flex items-center justify-between font-heading text-sm font-semibold text-plum-800">
              {category.label}<span className="text-coral-400 transition-transform group-hover:translate-x-1">→</span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-plum-500">Browse {category.text}.</p>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-plum-400">
        Need help before ordering? Check our <Link href="/delivery/" className="font-bold text-coral-600">delivery information</Link>,{" "}
        <Link href="/return-policy/" className="font-bold text-coral-600">return policy</Link> or{" "}
        <Link href="/contact/" className="font-bold text-coral-600">contact the GeduShop team</Link>.
      </p>
    </section>
  );
}
