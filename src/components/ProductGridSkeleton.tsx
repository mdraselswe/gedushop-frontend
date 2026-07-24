/** Card-shaped skeletons matching ProductGrid layout — shown while products load. */
export default function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-plum-100/60 bg-white">
          <div className="aspect-square animate-pulse bg-plum-50" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-16 animate-pulse rounded bg-plum-50" />
            <div className="h-3 w-full animate-pulse rounded bg-plum-50" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-plum-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
