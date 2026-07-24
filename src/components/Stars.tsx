import { Star } from "lucide-react";

/** Read-only star rating. `value` 0–5 (supports halves via fill width). */
export default function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`Rated ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i)); // 0..1 for this star
        return (
          <span key={i} className="relative">
            <Star className={`${className} text-plum-200`} strokeWidth={2} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${className} fill-amber-400 text-amber-400`} strokeWidth={2} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
