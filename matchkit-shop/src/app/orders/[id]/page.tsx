import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNaira, KIT_LABELS, storageUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { placed, email } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);

  // Row Level Security only returns the order if it belongs to this user.
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .order("id", { referencedTable: "order_items" })
    .maybeSingle();
  if (!order) notFound();

  const items = order.order_items as {
    id: number;
    product_name: string;
    club_name: string;
    kit_type: string;
    image_path: string | null;
    size: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-8 sm:pt-14">
      <div className="text-center">
        <p className="eyebrow mb-4 text-accent">{placed ? "Order confirmed" : "Order details"}</p>
        <h1 className="text-3xl font-light sm:text-4xl">
          {placed ? <>Thank you, {order.customer_name.split(" ")[0]}.</> : <>Order {order.order_number}</>}
        </h1>
        {placed && (
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/80">
            {email === "failed" ? (
              <>
                Your order has been placed and saved. We couldn&apos;t send the confirmation email to <strong>{order.email}</strong>{" "}
                right now, so please keep this page or note your order number below.
              </>
            ) : (
              <>
                Your order has been placed. A confirmation email is on its way to <strong>{order.email}</strong>.
              </>
            )}
          </p>
        )}
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-px bg-line text-sm sm:grid-cols-4">
        {[
          ["Order number", order.order_number],
          ["Date", formatDate(order.created_at)],
          ["Items", String(count)],
          ["Total", formatNaira(order.total)],
        ].map(([k, v]) => (
          <div key={k} className="bg-sand px-4 py-4">
            <dt className="label">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="eyebrow mb-4">Jerseys</h2>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((i) => {
            const img = storageUrl(i.image_path);
            return (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <span className="relative size-16 shrink-0 bg-sand">
                  {img && <Image src={img} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">
                    {i.club_name} {KIT_LABELS[i.kit_type] ?? i.kit_type} Jersey
                  </span>
                  <span className="text-xs text-stone">
                    Size {i.size} · Qty {i.quantity} · {formatNaira(i.unit_price)} each
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatNaira(i.line_total)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">Subtotal</dt>
            <dd>{formatNaira(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Delivery</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt>Total</dt>
            <dd>{formatNaira(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-6 border-t border-line pt-8 text-sm sm:grid-cols-2">
        <div>
          <h2 className="label">Customer</h2>
          <p>{order.customer_name}</p>
          <p className="text-stone">{order.email}</p>
          <p className="text-stone">{order.phone}</p>
        </div>
        <div>
          <h2 className="label">Delivery address</h2>
          <p>{order.address}</p>
          <p className="text-stone">
            {order.city}, {order.state}
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="btn-solid">
          Continue shopping
        </Link>
        <Link href="/account" className="btn-outline">
          My orders
        </Link>
      </div>
    </div>
  );
}
