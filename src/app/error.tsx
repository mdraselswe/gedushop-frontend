"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-coral-50">
        <TriangleAlert className="size-10 text-coral-500" strokeWidth={1.75} />
      </span>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-plum-700">Something went wrong</h1>
      <p className="mt-2 text-sm text-plum-500">
        We hit a snag loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-coral-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
      >
        Try Again
      </button>
    </div>
  );
}
