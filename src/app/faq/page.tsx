import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers about delivery, cash on delivery, returns, order tracking and payment at GeduShop.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse products, add them to your cart, and checkout. No account needed — just your name, phone and delivery address. You'll get a confirmation once we receive the order.",
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes. Cash on Delivery is available all over Bangladesh — you pay only when the product reaches your hands. No advance payment required.",
  },
  {
    q: "What are the delivery charges?",
    a: "Inside Dhaka ৳60, outside Dhaka ৳120. Orders over ৳2000 get free delivery anywhere in Bangladesh.",
  },
  {
    q: "How long does delivery take?",
    a: "Inside Dhaka usually 1–2 days, outside Dhaka 2–4 days after the order is confirmed. Delivery time may vary during peak seasons.",
  },
  {
    q: "How can I track my order?",
    a: "Use the Track Order page with your order number and the phone number you ordered with. You'll see the current status of your order.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "Yes. If a product arrives damaged, defective or wrong, contact us within 3 days of delivery for a replacement or refund. Please keep the product unused with its packaging.",
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
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800 md:text-3xl">
        Frequently asked questions
      </h1>
      <p className="mt-1.5 text-sm text-plum-400">Everything about ordering, delivery and returns.</p>

      <div className="mt-6 space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 [&_summary]:list-none"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 font-heading text-base font-semibold text-plum-800">
              {f.q}
              <ChevronDown
                className="size-5 shrink-0 text-plum-400 transition-transform group-open:rotate-180"
                strokeWidth={2.25}
              />
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-plum-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
