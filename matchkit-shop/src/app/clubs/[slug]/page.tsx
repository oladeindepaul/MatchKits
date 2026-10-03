import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClubs, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductCard";

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const club = (await getClubs()).find((c) => c.slug === slug);
  return { title: club ? `${club.name} jerseys` : "Club not found" };
}

export default async function ClubPage({ params }: PageProps<"/clubs/[slug]">) {
  const { slug } = await params;
  const [clubs, products] = await Promise.all([getClubs(), getProducts()]);
  const club = clubs.find((c) => c.slug === slug);
  if (!club) notFound();

  const kits = products.filter((p) => p.club.slug === slug);
  const others = products.filter((p) => p.club.league.slug === club.league.slug && p.club.slug !== slug && p.kitType === "home").slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <nav className="eyebrow flex gap-2 text-[10px] text-stone">
        <Link href="/leagues" className="hover:text-ink">
          Leagues
        </Link>
        <span>/</span>
        <Link href={`/leagues/${club.league.slug}`} className="hover:text-ink">
          {club.league.name}
        </Link>
      </nav>

      <header className="mb-12 mt-6 flex items-center gap-5">
        {club.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.logo} alt={`${club.name} crest`} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
        )}
        <div>
          <p className="eyebrow mb-2 text-stone">
            {club.league.name} · {kits.length} kit{kits.length === 1 ? "" : "s"}
          </p>
          <h1 className="text-3xl font-light sm:text-4xl">{club.name}</h1>
        </div>
      </header>

      <ProductGrid products={kits} />

      {others.length > 0 && (
        <section className="mt-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-light">
              <span className="text-stone">/ </span>More from {club.league.name}
            </h2>
            <Link href={`/leagues/${club.league.slug}`} className="eyebrow text-accent hover:text-ink">
              View all
            </Link>
          </div>
          <ProductGrid products={others} />
        </section>
      )}
    </div>
  );
}
