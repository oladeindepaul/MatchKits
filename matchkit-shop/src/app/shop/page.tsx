import type { Metadata } from "next";
import { filterProducts, getClubs, getLeagues, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductCard";
import { ShopFilters } from "@/components/ShopFilters";
import { PRICE_RANGES } from "@/lib/format";
import Link from "next/link";

export const metadata: Metadata = { title: "Shop all jerseys" };

const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const filters = {
    q: one(sp.q),
    league: one(sp.league),
    club: one(sp.club),
    kit: one(sp.kit),
    price: one(sp.price),
    sort: one(sp.sort),
  };
  const range = PRICE_RANGES.find((r) => r.value === filters.price);

  const [products, leagues, clubs] = await Promise.all([getProducts(), getLeagues(), getClubs()]);
  const results = filterProducts(products, { ...filters, min: range?.min, max: range?.max });
  const league = leagues.find((l) => l.slug === filters.league);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <header className="mb-8">
        <p className="eyebrow mb-3 text-stone">{league ? league.name : "All leagues"}</p>
        <h1 className="text-3xl font-light sm:text-4xl">
          <span className="text-stone">/ </span>
          {filters.q ? <>Results for “{filters.q}”</> : "All jerseys"}
        </h1>
      </header>

      <ShopFilters
        key={filters.q ?? ""}
        values={filters}
        leagues={leagues.map((l) => ({ value: l.slug, label: l.name }))}
        clubs={clubs.map((c) => ({ value: c.slug, label: c.name, league: c.league.slug }))}
        count={results.length}
      />

      {results.length ? (
        <ProductGrid products={results} />
      ) : (
        <div className="bg-sand px-6 py-20 text-center">
          <p className="text-lg font-light">No jerseys match those filters.</p>
          <p className="mt-2 text-sm text-stone">Try a different club or league, or clear the filters.</p>
          <Link href="/shop" className="btn-outline mt-8">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
