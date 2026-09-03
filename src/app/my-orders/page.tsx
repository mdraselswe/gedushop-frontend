import type { Metadata } from "next";
import OrderList from "@/components/OrderList";

export const metadata: Metadata = { title: "My Orders" };

export default function MyOrdersPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">My Orders</h1>
      <p className="mt-1 text-sm text-plum-500">
        Every order you&apos;ve placed, with its current status — no login needed.
      </p>
      <OrderList />
    </div>
  );
}
