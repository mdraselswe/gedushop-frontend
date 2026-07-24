import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-plum-50">
        <PackageX className="size-10 text-plum-300" strokeWidth={1.75} />
      </span>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-plum-700">Page not found</h1>
      <p className="mt-2 text-sm text-plum-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-plum-200 px-6 py-2.5 text-sm font-extrabold text-plum-600 hover:bg-plum-50"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
