"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import type { StoreReview } from "@/lib/types";
import { decodeEntities } from "@/lib/decode";
import { apiFetch, GEDU_API, STORE_API } from "@/lib/api";
import Stars from "./Stars";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProductReviews({
  productId,
  averageRating,
  reviewCount,
}: {
  productId: number;
  averageRating: number;
  reviewCount: number;
}) {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`${STORE_API}/products/reviews?product_id=${productId}&per_page=20`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: StoreReview[]) => setReviews(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || !name.trim() || !text.trim()) {
      setError("Please add your name, a rating and a short review.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${GEDU_API}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, reviewer: name, email, rating, review: text }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Could not submit. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-plum-100 bg-white px-4 py-2.5 text-sm text-plum-800 placeholder:text-plum-300 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100";

  return (
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-plum-700">Reviews</h2>
          {reviewCount > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <Stars value={averageRating} className="size-4" />
              <span className="text-sm font-bold text-plum-600">{averageRating.toFixed(1)}</span>
              <span className="text-xs font-semibold text-plum-400">({reviewCount})</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-plum-400">No reviews yet — be the first!</p>
          )}
        </div>
        {!showForm && !done && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-plum-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-plum-700"
          >
            Write a review
          </button>
        )}
      </div>

      {done && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Thanks! Your review was submitted and will show after approval.
        </p>
      )}

      {showForm && !done && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-plum-100 pt-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star`}
              >
                <Star
                  className={`size-7 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-plum-200"}`}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" className={inputCls} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email" className={inputCls} />
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience *" rows={3} className={inputCls} />
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-coral-500 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-coral-600 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-plum-200 px-5 py-2.5 text-sm font-bold text-plum-500 hover:bg-plum-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-4 border-t border-plum-100 pt-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-plum-300" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-plum-400">No reviews to show yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-b border-plum-50 pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} className="size-3.5" />
                <span className="text-sm font-bold text-plum-700">{decodeEntities(r.reviewer)}</span>
                {r.verified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Verified</span>}
                <span className="ml-auto text-xs text-plum-300">{formatDate(r.date_created)}</span>
              </div>
              <div
                className="mt-1.5 text-sm leading-relaxed text-plum-600 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: r.review }}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
