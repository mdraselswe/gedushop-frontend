"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqItem({
  number,
  question,
  children,
  defaultOpen = false,
}: {
  number: string;
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow,transform] duration-300 motion-reduce:transition-none ${
        open
          ? "border-coral-200 shadow-[var(--shadow-lift)]"
          : "border-plum-100 shadow-[var(--shadow-soft)] hover:border-plum-200 hover:shadow-[var(--shadow-lift)]"
      }`}
    >
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5"
        >
          <span
            aria-hidden="true"
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition-colors duration-300 ${
              open ? "bg-coral-500 text-white" : "bg-plum-50 text-plum-500"
            }`}
          >
            {number}
          </span>
          <span className="min-w-0 flex-1 font-heading text-[0.98rem] font-semibold leading-snug text-plum-800 sm:text-base">
            {question}
          </span>
          <span
            aria-hidden="true"
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
              open ? "bg-coral-50 text-coral-600" : "bg-plum-50 text-plum-400"
            }`}
          >
            <ChevronDown
              className={`size-4.5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                open ? "rotate-180" : ""
              }`}
              strokeWidth={2.5}
            />
          </span>
        </button>
      </h2>

      <div
        id={panelId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-plum-100 px-4 pb-5 pt-4 text-sm leading-7 text-plum-600 sm:ml-13 sm:px-5">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}
