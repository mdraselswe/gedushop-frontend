import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PHONE, PHONE_DISPLAY, WHATSAPP } from "@/lib/contact";

// lucide dropped brand icons — inline the Facebook mark.
function Facebook({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with GeduShop — call, WhatsApp, email or message us on Facebook.",
  alternates: { canonical: "/contact/" },
};

const EMAIL = "gedu.shop@gmail.com";
const FACEBOOK = "https://facebook.com/gedushop";

const CHANNELS = [
  {
    Icon: Phone,
    label: "Call us",
    value: PHONE_DISPLAY,
    href: `tel:${PHONE}`,
    note: "Tap to call",
  },
  {
    Icon: MessageCircle,
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    href: `https://wa.me/${WHATSAPP}`,
    note: "Chat with us",
  },
  {
    Icon: Mail,
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    note: "We reply within a day",
  },
  {
    Icon: Facebook,
    label: "Facebook",
    value: "facebook.com/gedushop",
    href: FACEBOOK,
    note: "Message our page",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">Contact Us</h1>
      <p className="mt-1 text-sm text-plum-500">
        Questions about an order or a product? Reach us any of these ways — we&apos;re happy to help.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CHANNELS.map(({ Icon, label, value, href, note }) => {
          const external = href.startsWith("http");
          return (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500">
                <Icon className="size-5" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wide text-plum-300">{label}</span>
                <span className="block truncate font-extrabold text-plum-700">{value}</span>
                <span className="block text-xs font-semibold text-plum-400">{note}</span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-plum-50 text-plum-600">
          <MapPin className="size-5" strokeWidth={2.25} />
        </span>
        <span>
          <span className="block font-extrabold text-plum-700">Nationwide delivery</span>
          <span className="block text-sm font-semibold text-plum-400">
            We deliver all over Bangladesh — cash on delivery.
          </span>
        </span>
      </div>
    </div>
  );
}
