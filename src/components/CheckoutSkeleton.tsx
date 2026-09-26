export default function CheckoutSkeleton() {
  return (
    <div className="mt-4 grid gap-5 pb-8 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px]" aria-label="Loading checkout">
      <div className="space-y-3">
        {[0, 1, 2, 3].map((index) => <div key={index} className="h-12 animate-pulse rounded-xl border border-plum-100 bg-white" />)}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded-xl border border-plum-100 bg-white" />
          <div className="h-12 animate-pulse rounded-xl border border-plum-100 bg-white" />
        </div>
        <div className="h-12 animate-pulse rounded-xl border border-plum-100 bg-white" />
        <div className="fancy-surface-strong space-y-3 rounded-3xl p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-plum-50" />
          <div className="h-14 animate-pulse rounded-xl bg-plum-50" />
        </div>
      </div>
      <div className="fancy-surface-strong h-fit space-y-4 rounded-3xl p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-plum-50" />
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="size-14 animate-pulse rounded-xl bg-plum-50" />
            <div className="flex-1 space-y-2"><div className="h-3.5 w-4/5 animate-pulse rounded bg-plum-50" /><div className="h-3 w-2/5 animate-pulse rounded bg-plum-50" /></div>
          </div>
        ))}
        <div className="h-24 animate-pulse rounded-xl bg-plum-50" />
        <div className="h-12 animate-pulse rounded-full bg-coral-50" />
      </div>
    </div>
  );
}
