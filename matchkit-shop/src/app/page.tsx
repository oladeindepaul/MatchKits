import Link from "next/link";
import { getLeagues, getProducts } from "@/lib/catalog";
import { formatNaira, KIT_LABELS } from "@/lib/format";
import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import { ProductGrid } from "@/components/ProductCard";
import { ArrowRight } from "@/components/Icons";

const BLURBS: Record<string, string> = {
  arsenal: "North London red for the new season. Breathable match fabric and a sharp collar for match days and everyday wear.",
  "real-madrid": "All-white elegance from the Bernabéu. Light, clean and built for the big European nights.",
  argentina: "The world champions' sky-blue stripes. A shirt for the bold and the believers.",
  "fc-barcelona": "Blaugrana stripes straight from Montjuïc. Soft-touch fabric with a classic cut.",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { league } = await searchParams;
  const activeLeague = typeof league === "string" ? league : undefined;
  const [products, leagues] = await Promise.all([getProducts(), getLeagues()]);

  const slides: HeroSlide[] = products
    .filter((p) => p.featured)
    .map((p) => ({
      slug: p.slug,
      club: p.club.name,
      league: p.club.league.name,
      kit: KIT_LABELS[p.kitType],
      price: formatNaira(p.price),
      image: p.image,
      blurb: BLURBS[p.club.slug] ?? p.description ?? "",
    }));

  // A mixed selection across leagues by default: one jersey per club.
  const pool = activeLeague ? products.filter((p) => p.club.league.slug === activeLeague) : interleave(products);
  const shown = pool.slice(0, 9);
  const total = activeLeague ? pool.length : products.length;
  const shopHref = activeLeague ? `/shop?league=${activeLeague}` : "/shop";

  return (
    <>
      <HeroSlider slides={slides} />

      <section className="mx-auto max-w-6xl px-4 sm:px-8" id="jerseys">
        <nav aria-label="Filter by league" className="flex flex-wrap justify-center gap-x-6 gap-y-3 py-10">
          <Chip href="/#jerseys" active={!activeLeague}>
            All
          </Chip>
          {leagues.map((l) => (
            <Chip key={l.slug} href={activeLeague === l.slug ? "/#jerseys" : `/?league=${l.slug}#jerseys`} active={activeLeague === l.slug}>
              {l.shortName}
            </Chip>
          ))}
        </nav>

        <ProductGrid products={shown} />

        <div className="mt-12 flex justify-center">
          <Link href={shopHref} className="eyebrow flex items-center gap-4 text-accent hover:text-ink">
            View all {total} jerseys <ArrowRight className="w-9" />
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-light">
            <span className="text-stone">/ </span>Shop by league
          </h2>
          <Link href="/leagues" className="eyebrow text-accent hover:text-ink">
            All clubs
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {leagues.map((l) => (
            <Link
              key={l.slug}
              href={`/leagues/${l.slug}`}
              className="group flex aspect-square flex-col sm:aspect-[4/5] items-center justify-between bg-sand p-5 transition-colors hover:bg-[#e8e1d3]"
            >
              <span className="grid flex-1 place-items-center">
                {l.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.logo} alt="" className="h-20 w-[80%] object-contain transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <span className="text-3xl font-light tracking-widest">INT</span>
                )}
              </span>
              <span className="eyebrow text-[10px]">{l.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`eyebrow flex items-center gap-1.5 transition-colors ${active ? "text-ink" : "text-stone hover:text-ink"}`}
    >
      {active && <span className="text-[13px] font-light leading-none">×</span>}
      {children}
    </Link>
  );
}

// Spread leagues out so the default grid isn't all Premier League.
function interleave<T extends { club: { league: { slug: string }; slug: string } }>(items: T[]) {
  const byLeague = new Map<string, T[]>();
  const seenClubs = new Set<string>();
  for (const item of items) {
    if (seenClubs.has(item.club.slug)) continue;
    seenClubs.add(item.club.slug);
    const list = byLeague.get(item.club.league.slug) ?? [];
    list.push(item);
    byLeague.set(item.club.league.slug, list);
  }
  const lists = [...byLeague.values()];
  const out: T[] = [];
  for (let i = 0; out.length < seenClubs.size; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
}
