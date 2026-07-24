import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-plum-500 hover:text-coral-500">
        <ArrowLeft className="size-4" strokeWidth={2.5} /> Home
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-plum-800 md:text-3xl">{title}</h1>
      <div className="mt-5 space-y-5 rounded-3xl bg-white p-6 text-sm leading-relaxed text-plum-600 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 md:p-8 md:text-[15px] [&_h2]:font-heading [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-plum-800 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
