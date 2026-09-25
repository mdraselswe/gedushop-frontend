import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { DeliveryFaqAnswer } from "@/components/DeliverySettingsCopy";
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
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
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
            <p className="mt-2.5 text-sm leading-relaxed text-plum-600">
              {"dynamicDelivery" in f && f.dynamicDelivery ? <DeliveryFaqAnswer /> : f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
