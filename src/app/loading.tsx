export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div className="h-32 animate-pulse rounded-2xl bg-white md:h-44" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-plum-100/60 bg-white">
            <div className="aspect-square animate-pulse bg-plum-50" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-16 animate-pulse rounded bg-plum-50" />
              <div className="h-3 w-full animate-pulse rounded bg-plum-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
