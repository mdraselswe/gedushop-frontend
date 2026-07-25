import { Check } from "lucide-react";
import { decodeEntities } from "@/lib/decode";

/**
 * WooCommerce short_description is a free-form HTML blob (often emoji marketing
 * copy). We flatten it into scannable check-bullet lines. If it isn't
 * line-structured (one long paragraph), we fall back to rendering it as prose.
 */
function toLines(html: string): string[] {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => decodeEntities(l).replace(/[▼►◆➤▲]/g, "").trim())
    .filter((l) => l.length > 1);
}

export default function Highlights({ html }: { html: string }) {
  if (!html) return null;
  const lines = toLines(html);

  if (lines.length <= 1) {
    return (
      <div
        className="mt-6 max-w-[65ch] text-sm leading-relaxed text-plum-600 [&_img]:hidden [&_p]:my-2 [&_strong]:text-plum-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-plum-50/50 p-4 ring-1 ring-plum-100/60">
      <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-plum-500">Highlights</h2>
      <ul className="space-y-2.5">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-plum-700">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600">
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
