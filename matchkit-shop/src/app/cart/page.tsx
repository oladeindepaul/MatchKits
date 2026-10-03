import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <h1 className="mb-10 text-3xl font-light sm:text-4xl">
        <span className="text-stone">/ </span>Your cart
      </h1>
      <CartView />
    </div>
  );
}
