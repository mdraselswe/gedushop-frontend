import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Banknote, HeartHandshake, Truck } from "lucide-react";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description: "GeduShop — a Bangladeshi baby & kids store. Safe products, fair prices, cash on delivery nationwide.",
  alternates: { canonical: "/about/" },
};

const VALUES = [
  { Icon: BadgeCheck, title: "Quality checked", text: "Every item is picked and checked like we'd give it to our own kids." },
  { Icon: Banknote, title: "Cash on delivery", text: "Pay only when your order reaches your door. No advance, no risk." },
  { Icon: Truck, title: "Nationwide delivery", text: "We deliver to every district in Bangladesh — city or village." },
  { Icon: HeartHandshake, title: "Fair prices", text: "Honest pricing on baby items and toys, with no hidden charges." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4">
      {/* Hero */}
      <section className="grain relative overflow-hidden rounded-3xl bg-gradient-to-br from-plum-600 to-coral-400 p-7 text-white shadow-[var(--shadow-lift)] md:p-10">
        <span className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="relative z-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/95 p-2 shadow-sm md:size-20">
            <Image src="/logo-light.png" alt="GeduShop" width={72} height={52} className="h-auto w-auto" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">About GeduShop</h1>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed opacity-95 md:text-base">
              A Bangladeshi online shop for baby items, toys and kids essentials — safe, fun and fairly priced.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <Reveal className="mt-6" as="section">
        <div className="rounded-3xl bg-white p-6 text-sm leading-relaxed text-plum-600 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 md:p-8 md:text-base">
          <p>
            GeduShop started with a simple idea — parents shouldn&apos;t have to choose between safe products and
            fair prices. We hand-pick baby care items and toys we would happily give our own little ones, and we
            keep the prices honest.
          </p>
          <p className="mt-4">
            Order from anywhere in Bangladesh and pay cash on delivery. No accounts to create, no hidden charges —
            just a quick, friendly way to shop for your child.
          </p>
        </div>
      </Reveal>

      {/* Values */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {VALUES.map(({ Icon, title, text }, i) => (
          <Reveal key={title} index={i}>
            <div className="flex h-full gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500">
                <Icon className="size-5" strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-plum-800">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-plum-500">{text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-plum-50/60 p-8 text-center ring-1 ring-plum-100/50">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-plum-800">
          Ready to shop for your little one?
        </h2>
        <Link
          href="/shop"
          className="rounded-full bg-coral-500 px-8 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-600 active:scale-[0.98]"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
