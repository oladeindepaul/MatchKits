"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY, useCart, type CartLine } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

export function AddToCart({
  line,
  sizes,
}: {
  line: Omit<CartLine, "quantity" | "size">;
  sizes: { size: string; inStock: boolean }[];
}) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  function handleAdd() {
    if (!size) {
      setError(true);
      return;
    }
    add({ ...line, size }, quantity);
    setAdded(`${quantity} × size ${size}`);
  }

  return (
    <div className="mt-8">
      <fieldset>
        <legend className="label flex w-full justify-between">
          <span>Size</span>
          {error && !size && <span className="normal-case tracking-normal text-danger">Please choose a size</span>}
        </legend>
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((s) => (
            <button
              key={s.size}
              type="button"
              disabled={!s.inStock}
              onClick={() => {
                setSize(s.size);
                setAdded(null);
              }}
              aria-pressed={size === s.size}
              className={`border py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:text-stone/50 disabled:line-through ${
                size === s.size ? "border-ink bg-ink text-cream" : error && !size ? "border-danger/60" : "border-line hover:border-ink"
              }`}
            >
              {s.size}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <span className="label">Quantity</span>
          <QuantityStepper value={quantity} max={MAX_QTY} onChange={(q) => { setQuantity(q); setAdded(null); }} />
        </div>
        <button type="button" onClick={handleAdd} className="btn-solid h-11 min-w-[11rem] flex-1">
          Add to cart
        </button>
      </div>

      {added && (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-sand px-4 py-3 text-sm">
          <span>Added {added} to your cart.</span>
          <span className="eyebrow flex gap-4 text-accent">
            <Link href="/cart" className="hover:text-ink">
              View cart
            </Link>
            <Link href="/checkout" className="hover:text-ink">
              Checkout
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
