export default function CartSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-label="Loading cart">
      <div className="h-[4.75rem] animate-pulse rounded-2xl bg-emerald-50 ring-1 ring-emerald-100" />
      {[0, 1].map((index) => (
        <div key={index} className="fancy-surface flex h-[5.75rem] items-center gap-3 rounded-2xl p-3">
          <div className="size-16 shrink-0 animate-pulse rounded-xl bg-plum-50" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-plum-50" />
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-plum-50" />
            <div className="h-4 w-20 animate-pulse rounded bg-plum-50" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-full bg-plum-50" />
        </div>
      ))}
      <div className="fancy-surface-strong space-y-4 rounded-3xl p-5">
        <div className="flex justify-between"><div className="h-4 w-20 animate-pulse rounded bg-plum-50" /><div className="h-4 w-16 animate-pulse rounded bg-plum-50" /></div>
        <div className="h-10 animate-pulse rounded-xl bg-plum-50" />
        <div className="h-12 animate-pulse rounded-full bg-coral-50" />
      </div>
    </div>
  );
}
