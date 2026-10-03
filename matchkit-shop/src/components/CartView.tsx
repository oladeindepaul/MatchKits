"use client";

import Image from "next/image";
import Link from "next/link";
import { formatNaira, KIT_LABELS } from "@/lib/format";
import { MAX_QTY, useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { ArrowLeft } from "./Icons";

export function CartView() {
  const { lines, ready, subtotal, count, setQuantity, remove } = useCart();

  if (!ready) return <p className="text-sm text-stone">Loading your cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="bg-sand px-6 py-20 text-center">
        <p className="text-lg font-light">Your cart is empty.</p>
        <p className="mt-2 text-sm text-stone">Find your club&apos;s new kit and it will show up here.</p>
        <Link href="/shop" className="btn-outline mt-8">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.size}`} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/products/${line.slug}`} className="relative size-20 shrink-0 overflow-hidden bg-sand sm:size-28">
                {line.image && <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link href={`/products/${line.slug}`} className="block truncate text-sm hover:text-accent">
                    {line.clubName}
                  </Link>
                  <p className="mt-0.5 text-xs text-stone">
                    {KIT_LABELS[line.kitType] ?? line.kitType} jersey · Size {line.size}
                  </p>
                  <p className="mt-1 text-xs text-stone">{formatNaira(line.price)} each</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-end">
                  <QuantityStepper
                    value={line.quantity}
                    max={MAX_QTY}
                    onChange={(q) => setQuantity(line.productId, line.size, q)}
                    label={`Quantity for ${line.name}, size ${line.size}`}
                  />
                  <p className="text-right text-sm tabular-nums sm:w-24">{formatNaira(line.price * line.quantity)}</p>
                </div>
              </div>
              <button
                onClick={() => remove(line.productId, line.size)}
                aria-label={`Remove ${line.name}, size ${line.size}`}
                className="self-start p-1 text-lg font-light leading-none text-stone hover:text-danger"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <Link href="/shop" className="eyebrow mt-6 inline-flex items-center gap-3 text-accent hover:text-ink">
          <ArrowLeft className="w-7" /> Continue shopping
        </Link>
      </div>

      <aside className="h-fit bg-sand p-6 sm:p-8">
        <h2 className="eyebrow mb-6">Order summary</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">
              Subtotal ({count} item{count === 1 ? "" : "s"})
            </dt>
            <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Delivery</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="btn-solid mt-8 w-full">
          Proceed to checkout
        </Link>
        <p className="mt-4 text-center text-xs text-stone">You&apos;ll be asked to log in or register before placing your order.</p>
      </aside>
    </div>
  );
}
