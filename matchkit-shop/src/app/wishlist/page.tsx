import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const heading = (
    <h1 className="mb-10 text-3xl font-light sm:text-4xl">
      <span className="text-stone">/ </span>Wishlist
    </h1>
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
        {heading}
        <div className="bg-sand px-6 py-20 text-center">
          <p className="text-lg font-light">Log in to see your saved jerseys.</p>
          <p className="mt-2 text-sm text-stone">Your wishlist is saved to your MatchKit account.</p>
          <Link href="/login?next=/wishlist" className="btn-outline mt-8">
            Log in or register
          </Link>
        </div>
      </div>
    );
  }

  const [{ data }, products] = await Promise.all([
    supabase.from("wishlist_items").select("product_id, created_at").order("created_at", { ascending: false }),
    getProducts(),
  ]);
  const saved = (data ?? [])
    .map((row) => products.find((p) => p.id === row.product_id))
    .filter((p) => p !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      {heading}
      {saved.length ? (
        <ProductGrid products={saved} />
      ) : (
        <div className="bg-sand px-6 py-20 text-center">
          <p className="text-lg font-light">No saved jerseys yet.</p>
          <p className="mt-2 text-sm text-stone">Tap the heart on any jersey to keep it here.</p>
          <Link href="/shop" className="btn-outline mt-8">
            Browse jerseys
          </Link>
        </div>
      )}
    </div>
  );
}
