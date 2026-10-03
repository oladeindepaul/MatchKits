import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNaira } from "@/lib/format";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_number, created_at, total, status, order_items(quantity)").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-8 sm:pt-14">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-stone">My account</p>
          <h1 className="text-3xl font-light sm:text-4xl">
            <span className="text-stone">/ </span>
            {profile?.full_name || user.email}
          </h1>
          <p className="mt-2 text-sm text-stone">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <h2 className="eyebrow mb-4">Orders</h2>
      {orders && orders.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line">
          {orders.map((o) => {
            const qty = (o.order_items as { quantity: number }[]).reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="grid grid-cols-2 gap-2 py-4 text-sm hover:text-accent sm:grid-cols-4">
                  <span className="font-medium">{o.order_number}</span>
                  <span className="text-right text-stone sm:text-left">{formatDate(o.created_at)}</span>
                  <span className="text-stone">
                    {qty} jersey{qty === 1 ? "" : "s"} · <span className="capitalize">{o.status}</span>
                  </span>
                  <span className="text-right tabular-nums">{formatNaira(o.total)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bg-sand px-6 py-14 text-center">
          <p className="font-light">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="btn-outline mt-6">
            Start shopping
          </Link>
        </div>
      )}

      <div className="mt-10 flex gap-6">
        <Link href="/wishlist" className="eyebrow text-accent hover:text-ink">
          My wishlist
        </Link>
      </div>
    </div>
  );
}
