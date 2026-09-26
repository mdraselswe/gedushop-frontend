import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <section className="grain relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-plum-700 via-plum-600 to-coral-500 p-6 text-white shadow-[var(--shadow-float)] md:p-8">
        <span aria-hidden className="absolute -right-14 -top-20 size-52 rounded-full bg-white/12 blur-2xl" />
        <Link href="/" className="relative inline-flex items-center gap-1.5 text-sm font-bold text-white/70 hover:text-white">
          <ArrowLeft className="size-4" strokeWidth={2.5} /> Home
        </Link>
        <p className="relative mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">GeduShop policies</p>
        <h1 className="relative mt-1 font-heading text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      </section>
      <div className="fancy-surface-strong mt-4 space-y-5 rounded-[2rem] p-6 text-sm leading-relaxed text-plum-600 md:p-8 md:text-[15px] [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-plum-800 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
