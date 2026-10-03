"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder, type CheckoutInput } from "@/app/checkout/actions";
import { formatNaira, KIT_LABELS } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/states";
import { useCart } from "./CartProvider";

type Fields = Omit<CheckoutInput, "lines">;

export function CheckoutForm({ defaults }: { defaults: { name: string; email: string; phone: string } }) {
  const { lines, ready, subtotal, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Fields>({ ...defaults, address: "", city: "", state: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutInput, string>>>({});

  if (!ready) return <p className="text-sm text-stone">Loading your cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="bg-sand px-6 py-20 text-center">
        <p className="text-lg font-light">Your cart is empty.</p>
        <Link href="/shop" className="btn-outline mt-8">
          Browse jerseys
        </Link>
      </div>
    );
  }

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setFieldErrors((f) => ({ ...f, [key]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await placeOrder({
        ...values,
        lines: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
      });
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fields ?? {});
        return;
      }
      clear();
      router.replace(`/orders/${result.orderId}?placed=1`);
    });
  }

  const field = (key: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className={`field ${fieldErrors[key] ? "border-danger" : ""}`}
        value={values[key]}
        onChange={set(key)}
        aria-invalid={!!fieldErrors[key]}
        required
        {...props}
      />
      {fieldErrors[key] && <span className="mt-1 block text-xs text-danger">{fieldErrors[key]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-10">
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-5">Contact</legend>
          {field("name", "Full name", { autoComplete: "name" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("email", "Email (for your confirmation)", { type: "email", autoComplete: "email" })}
            {field("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "080 0000 0000" })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-5">Delivery</legend>
          {field("address", "Street address", { autoComplete: "street-address" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("city", "City / town", { autoComplete: "address-level2" })}
            <label className="block">
              <span className="label">State</span>
              <select
                className={`field cursor-pointer ${fieldErrors.state ? "border-danger" : ""}`}
                value={values.state}
                onChange={set("state")}
                required
                autoComplete="address-level1"
              >
                <option value="" disabled>
                  Choose a state
                </option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {fieldErrors.state && <span className="mt-1 block text-xs text-danger">{fieldErrors.state}</span>}
            </label>
          </div>
        </fieldset>

        <div className="border border-line bg-paper px-5 py-4 text-sm leading-relaxed text-ink/80">
          <p className="eyebrow mb-1 text-stone">Payment</p>
          No online payment is taken. Placing your order reserves your jerseys and we&apos;ll contact you to arrange payment and delivery.
        </div>
      </div>

      <aside className="h-fit bg-sand p-6 sm:p-8">
        <h2 className="eyebrow mb-6">Your order</h2>
        <ul className="space-y-4">
          {lines.map((l) => (
            <li key={`${l.productId}-${l.size}`} className="flex items-center gap-4">
              <span className="relative size-14 shrink-0 bg-cream">
                {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] text-cream">
                  {l.quantity}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{l.clubName}</span>
                <span className="text-xs text-stone">
                  {KIT_LABELS[l.kitType] ?? l.kitType} · Size {l.size}
                </span>
              </span>
              <span className="text-sm tabular-nums">{formatNaira(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">Subtotal</dt>
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

        {error && (
          <p role="alert" className="mt-5 text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-solid mt-6 w-full">
          {pending ? "Placing order…" : `Place order · ${formatNaira(subtotal)}`}
        </button>
        <Link href="/cart" className="eyebrow mt-4 block text-center text-[10px] text-accent hover:text-ink">
          Edit cart
        </Link>
      </aside>
    </form>
  );
}
