import type { Metadata } from "next";
import Link from "next/link";
import { getClubs, getLeagues } from "@/lib/catalog";
import { ClubTile } from "@/components/ClubTile";

export const metadata: Metadata = { title: "Leagues & clubs" };

export default async function LeaguesPage() {
  const [leagues, clubs] = await Promise.all([getLeagues(), getClubs()]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <h1 className="mb-12 text-3xl font-light sm:text-4xl">
        <span className="text-stone">/ </span>Leagues &amp; clubs
      </h1>

      <div className="space-y-16">
        {leagues.map((league) => (
          <section key={league.slug}>
            <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
              <Link href={`/leagues/${league.slug}`} className="flex items-center gap-3 hover:text-accent">
                {league.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={league.logo} alt="" className="h-8 w-12 object-contain" />
                )}
                <h2 className="text-xl font-light">{league.name}</h2>
              </Link>
              <Link href={`/leagues/${league.slug}`} className="eyebrow text-accent hover:text-ink">
                Shop {league.shortName}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 min-[360px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
              {clubs
                .filter((c) => c.league.slug === league.slug)
                .map((club) => (
                  <ClubTile key={club.slug} club={club} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
