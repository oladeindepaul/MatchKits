import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClubs, getLeagues, getProducts } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { ProductGrid } from "@/components/ProductCard";
import { ClubTile } from "@/components/ClubTile";

export async function generateMetadata({ params }: PageProps<"/leagues/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const league = (await getLeagues()).find((l) => l.slug === slug);
  return { title: league ? `${league.name} jerseys` : "League not found" };
}

export default async function LeaguePage({ params }: PageProps<"/leagues/[slug]">) {
  const { slug } = await params;
  const [leagues, clubs, products] = await Promise.all([getLeagues(), getClubs(), getProducts()]);
  const league = leagues.find((l) => l.slug === slug);
  if (!league) notFound();

  const leagueClubs = clubs.filter((c) => c.league.slug === slug);
  const leagueProducts = products.filter((p) => p.club.league.slug === slug);
  const prices = leagueProducts.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <Link href="/leagues" className="eyebrow text-[10px] text-stone hover:text-ink">
        ‹ All leagues
      </Link>

      <header className="mb-12 mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-3 text-stone">
            {leagueClubs.length} {slug === "international" ? "nations" : "clubs"} · {leagueProducts.length} jerseys ·{" "}
            {min === max ? formatNaira(min) : `${formatNaira(min)} – ${formatNaira(max)}`}
          </p>
          <h1 className="text-3xl font-light sm:text-4xl">
            <span className="text-stone">/ </span>
            {league.name}
          </h1>
        </div>
        {league.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.logo} alt={`${league.name} logo`} className="h-16 w-24 self-start object-contain sm:h-20 sm:w-28 sm:self-auto" />
        )}
      </header>

      <section className="mb-16">
        <h2 className="eyebrow mb-4 text-stone">Choose a {slug === "international" ? "nation" : "club"}</h2>
        <div className="grid grid-cols-2 gap-3 min-[360px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
          {leagueClubs.map((club) => (
            <ClubTile key={club.slug} club={club} />
          ))}
        </div>
      </section>

      <h2 className="eyebrow mb-4 text-stone">All {league.shortName} jerseys</h2>
      <ProductGrid products={leagueProducts} />
    </div>
  );
}
