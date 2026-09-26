import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, PackageCheck, RotateCcw, Sparkles, Truck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { DeliveryFaqAnswer } from "@/components/DeliverySettingsCopy";
import FaqItem from "@/components/FaqItem";
import { serializeJsonLd } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers about delivery, cash on delivery, returns, order tracking and payment at GeduShop.",
  alternates: { canonical: "/faq/" },
};

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse products, add them to your cart, and checkout. No account needed — just your name, phone and delivery address. You'll get a confirmation once we receive the order.",
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes. Cash on Delivery is available across Bangladesh. When bKash is enabled, it may also appear as a separate checkout option with the payment number and instructions.",
  },
  {
    q: "What are the delivery charges?",
    a: "Delivery charges vary between Dhaka and the rest of Bangladesh. The current charges and free-delivery minimum are shown below.",
    dynamicDelivery: true,
  },
  {
    q: "How long does delivery take?",
    a: "Inside Dhaka usually 1–2 working days and outside Dhaka 3–5 working days after confirmation. Courier coverage, holidays, weather or an unreachable phone can add time.",
  },
  {
    q: "How can I track my order?",
    a: "Open Track Order. Orders saved on your current device can open securely without putting your phone number in the link; for an older or different device, enter the order number and phone used at checkout.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "If a product arrives missing, damaged, defective or wrong, contact us within 3 days. Keep it unused with its packaging and provide the complete unboxing evidence described in our Return & Refund Policy.",
  },
  {
    q: "Can I cancel or change an order?",
    a: "Contact us as soon as possible. We can usually cancel or update details before dispatch, but a parcel already handed to the courier may no longer be changeable.",
  },
  {
    q: "How is a bKash payment confirmed?",
    a: "Choose bKash only when it appears at checkout, send the exact displayed amount to the displayed number, and enter the transaction ID. We verify the payment before dispatch; never share a PIN or one-time code.",
  },
  {
    q: "What happens after I place an order?",
    a: "You receive an order number and our team calls to confirm the order and address. After confirmation, the parcel is packed, handed to the courier and its status can be checked from Track Order.",
  },
  {
    q: "Who pays return delivery?",
    a: "For a verified wrong, missing, damaged or defective item caused by us or delivery, GeduShop arranges or covers the reasonable return or replacement delivery cost. Contact us for approval and instructions first.",
  },
  {
    q: "Do I need an account, and how is my data used?",
    a: "No account is required. We use your order details for confirmation, delivery and support, and optional analytics or advertising only according to your cookie choice. See the Privacy Policy for details.",
  },
  {
    q: "Are the products genuine and safe for kids?",
    a: "All our baby items and toys are quality-checked. Product details list the materials and suitable age range so you can choose safely.",
  },
  {
    q: "How do I contact GeduShop?",
    a: "Message us on WhatsApp or call for the fastest response — details are on the Contact page. We're happy to help before and after your order.",
  },
];

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <section className="grain relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-plum-700 via-plum-600 to-coral-500 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-14 -top-16 -z-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-20 left-1/3 -z-10 size-52 rounded-full bg-coral-300/20 blur-3xl" />

        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm sm:size-14">
            <CircleHelp className="size-6 sm:size-7" strokeWidth={2} />
          </span>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="size-3.5" /> Help centre
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Questions? We have answers.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Quick, clear information about ordering, payment, delivery, tracking and returns.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          {[
            { label: "Ordering", icon: PackageCheck },
            { label: "Delivery", icon: Truck },
            { label: "Returns", icon: RotateCcw },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm sm:flex-row sm:gap-2">
              <Icon className="size-4.5" strokeWidth={2.25} />
              <span className="text-xs font-extrabold sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-3">
        {FAQS.map((f, index) => (
          <FaqItem
            key={f.q}
            number={String(index + 1).padStart(2, "0")}
            question={f.q}
            defaultOpen={index === 0}
          >
            {"dynamicDelivery" in f && f.dynamicDelivery ? <DeliveryFaqAnswer /> : <p>{f.a}</p>}
          </FaqItem>
        ))}
      </div>

      <section className="mt-7 flex flex-col gap-4 border-t border-plum-100 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-plum-800">Still need a little help?</h2>
          <p className="mt-1 text-sm text-plum-500">Our team is happy to help before or after your order.</p>
        </div>
        <Link
          href="/contact"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-coral-500 px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-transform hover:-translate-y-0.5 hover:bg-coral-600"
        >
          Contact us <ArrowRight className="size-4" strokeWidth={2.5} />
        </Link>
      </section>
    </div>
  );
}
