export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4" aria-label="Loading product">
      <div className="mb-4 h-8 w-64 animate-pulse rounded-full bg-white shadow-[var(--shadow-soft)]" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
        <div>
          <div className="aspect-square animate-pulse rounded-2xl border border-plum-100 bg-white shadow-[var(--shadow-soft)]" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="size-16 animate-pulse rounded-xl bg-white ring-1 ring-plum-100" />)}
          </div>
        </div>
        <div className="fancy-surface-strong space-y-5 rounded-2xl p-5 md:p-7">
          <div className="h-8 w-4/5 animate-pulse rounded bg-plum-50" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-plum-50" />
          <div className="h-9 w-28 animate-pulse rounded bg-plum-50" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-plum-50" />
          <div className="grid grid-cols-2 gap-3"><div className="h-12 animate-pulse rounded-full bg-plum-50" /><div className="h-12 animate-pulse rounded-full bg-coral-50" /></div>
          <div className="h-36 animate-pulse rounded-2xl bg-plum-50" />
        </div>
      </div>
    </div>
  );
}
