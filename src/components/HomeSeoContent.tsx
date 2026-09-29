import Link from "next/link";
import { Sparkles, HelpCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { serializeJsonLd } from "@/lib/jsonLd";

const categories = [
  {
    href: "/category/toys/",
    label: "বাচ্চাদের খেলনা (Kids Toys)",
    desc: "ছোট বাবুদের খেলনা (babuder khelna), পুতুল, গাড়ি ও অ্যাক্টিভিটি টয়স",
  },
  {
    href: "/category/education/",
    label: "শিক্ষামূলক খেলনা (Educational Toys)",
    desc: "টকিং বুক, পাজল, রাইটিং প্যাড ও আর্লি লার্নিং টয়",
  },
  {
    href: "/category/baby-clothing/",
    label: "বাচ্চাদের জামাকাপড় (Baby Clothing)",
    desc: "আরামদায়ক সুতি পোশাক, বেবি ড্রেস ও কিডস ক্লোথিং",
  },
  {
    href: "/category/feeding-nursing/",
    label: "বেবি ফিডিং সামগ্রী (Feeding Essentials)",
    desc: "ফিডিং বোতল, সিলিকন বাটি ও নার্সিং সামগ্রী",
  },
  {
    href: "/category/school-stationery-supplies/",
    label: "স্কুল ও স্টেশনারি (School Supplies)",
    desc: "কিউট কার্টুন স্টেশনারি সেট, পেন ও স্কুল কিট",
  },
  {
    href: "/category/combo-offers/",
    label: "কম্বো অফার (Combo Offers)",
    desc: "সাশ্রয়ী মূল্যে স্পেশাল বেবি গিফট ও খেলনা বান্ডেল",
  },
];

const faqs = [
  {
    q: "GeduShop থেকে কীভাবে বাচ্চাদের খেলনা ও বেবি আইটেম অর্ডার করবেন?",
    a: "ওয়েবসাইটে আপনার পছন্দের খেলনা বা বেবি প্রোডাক্টটি বেছে নিয়ে 'Buy Now' বা 'Add to Cart' বাটনে ক্লিক করুন। এরপর নাম, ডেলিভারি ঠিকানা ও ফোন নম্বর দিয়ে অর্ডার কনফার্ম করুন। কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার করা যায়।",
  },
  {
    q: "সারা বাংলাদেশে কি ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা আছে?",
    a: "হ্যাঁ, GeduShop সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা প্রদান করে। পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারবেন। ঢাকা সদরে ডেলিভারি চার্জ মাত্র ৳৮০ এবং ঢাকার বাইরে ৳১২০।",
  },
  {
    q: "ছোট বাবুদের খেলনা (babuder khelna) ও পণ্যের নিরাপত্তা কেমন?",
    a: "আমরা শিশুদের নিরাপত্তার বিষয়ে সর্বোচ্চ সতর্ক। প্রতিটি খেলনা ও বেবি কেয়ার সামগ্রী নন-টক্সিক ও শিশুবান্ধব মেটেরিয়ালে তৈরি। কোনো ভাঙা বা ত্রুটিপূর্ণ পণ্য পেলে দ্রুত রিপ্লেসমেন্ট ও ৩ দিনের সহজ রিটার্ন পলিসি রয়েছে।",
  },
  {
    q: "অর্ডার ডেলিভারি হতে কত দিন সময় লাগে?",
    a: "ঢাকার ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।",
  },
];

export default function HomeSeoContent() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <section className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      {/* Main Bilingual SEO Overview */}
      <div className="fancy-surface relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7 md:p-8">
        <span
          aria-hidden
          className="absolute -right-12 -top-16 size-48 rounded-full bg-coral-100/40 blur-3xl pointer-events-none"
        />

        <div className="max-w-4xl">
          <span className="section-kicker">
            <Sparkles className="size-3" /> বেবি শপ বাংলাদেশ · Baby & Kids Store
          </span>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-plum-800 md:text-2xl lg:text-3xl">
            বাচ্চাদের খেলনা, পোশাক ও শিশুর প্রয়োজনীয় পণ্যের বিশ্বস্ত অনলাইন শপ — GeduShop
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-plum-600 sm:text-base">
            <strong>GeduShop (গেদুশপ)</strong> বাংলাদেশের অভিভাবকদের জন্য তৈরি একটি বিশ্বস্ত অনলাইন বেবি শপ।
            আমাদের এখানে পাবেন সেরা মানের <strong>বাচ্চাদের খেলনা (Kids Toys)</strong>, নবজাতক ও ছোট শিশুদের{" "}
            <strong>আরামদায়ক জামাকাপড় (Baby Clothing)</strong>, ফিডিং সামগ্রী এবং শিক্ষামূলক এক্সেসরিজ।
            প্রতিটি পণ্য শিশুদের জন্য শতভাগ নিরাপদ ও কোয়ালিটি যাচাইকৃত।
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-plum-100/70 bg-white/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-plum-800">নিরাপদ ও নন-টক্সিক</h3>
              <p className="mt-0.5 text-xs text-plum-500">শিশুদের স্বাস্থ্যের জন্য ১০০% নিরাপদ উপাদানে তৈরি পণ্য।</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-plum-100/70 bg-white/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
              <Truck className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-plum-800">ক্যাশ অন ডেলিভারি</h3>
              <p className="mt-0.5 text-xs text-plum-500">সারা দেশে ঘরে বসে পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা।</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-plum-100/70 bg-white/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
              <PackageCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-plum-800">সহজ রিটার্ন পলিসি</h3>
              <p className="mt-0.5 text-xs text-plum-500">যেকোনো সমস্যায় ৩ দিনের ঝামেলাহীন রিটার্ন ও রিপ্লেসমেন্ট।</p>
            </div>
          </div>
        </div>

        {/* Keyword Category Links */}
        <div className="mt-6">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-plum-400">
            জনপ্রিয় ক্যাটাগরি সমূহ · Popular Collections
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-xl border border-plum-100/70 bg-white/70 p-3.5 transition-all duration-200 hover:border-coral-200 hover:bg-white hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold text-plum-800 group-hover:text-coral-600 transition-colors">
                    {c.label}
                  </span>
                  <span className="text-xs text-coral-400 transition-transform group-hover:translate-x-0.5">→</span>
                </div>
                <p className="mt-1 text-xs text-plum-500">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Informative Content for Ranking */}
        <div className="mt-6 border-t border-plum-100/60 pt-5 text-xs leading-relaxed text-plum-500 space-y-2">
          <p>
            <strong>বাচ্চাদের খেলনা ও শিক্ষামূলক সামগ্রী:</strong> ছোট বাবুদের শারীরিক ও মানসিক বিকাশের জন্য উপযুক্ত খেলনা অত্যন্ত জরুরি।
            GeduShop-এ রয়েছে শিশুদের জন্য বিশেষ লার্নিং টকিং বুক, ম্যাজিক ওয়াটার ড্রয়িং বুক, বিভিন্ন বয়সের পাজল এবং ক্রিয়েটিভ টয়স।
            আপনি যদি সাশ্রয়ী মূল্যে সেরা <em>babuder khelna</em> বা baby toys খুঁজে থাকেন, তবে GeduShop আপনার প্রথম পছন্দ।
          </p>
          <p>
            <strong>বেবি ড্রেস ও জামাকাপড় (Baby Clothing):</strong> কোমল ত্বকের শিশুদের জন্য নরম ও আরামদায়ক সুতি কাপড় নিশ্চিত করা জরুরি।
            আমাদের কালেকশনে রয়েছে নবজাতক শিশু থেকে শুরু করে বিভিন্ন বয়সের ছেলে ও মেয়ে বাচ্চাদের স্টাইলিশ ও স্বাস্থ্যকর পোশাক।
          </p>
        </div>

        <p className="mt-4 text-xs text-plum-400">
          অর্ডার বা পণ্য সংক্রান্ত তথ্যের জন্য ভিজিট করুন আমাদের{" "}
          <Link href="/delivery/" className="font-bold text-coral-600 hover:underline">
            ডেলিভারি তথ্য
          </Link>
          ,{" "}
          <Link href="/return-policy/" className="font-bold text-coral-600 hover:underline">
            রিটার্ন পলিসি
          </Link>{" "}
          অথবা{" "}
          <Link href="/contact/" className="font-bold text-coral-600 hover:underline">
            সরাসরি যোগাযোগ করুন
          </Link>
          ।
        </p>
      </div>

      {/* Frequently Asked Questions (FAQ) Section with Schema */}
      <div className="fancy-surface rounded-[1.75rem] p-5 sm:p-7">
        <div className="flex items-center gap-2 text-plum-800">
          <HelpCircle className="size-5 text-coral-500" />
          <h2 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
            সাধারণ জিজ্ঞাসা ও উত্তর (FAQ)
          </h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-plum-100/70 bg-white/70 p-4 transition-colors hover:bg-white"
            >
              <h3 className="font-heading text-sm font-semibold text-plum-800">
                {faq.q}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-plum-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
