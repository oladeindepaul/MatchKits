import Link from "next/link";
import { getLeagues } from "@/lib/catalog";

export async function Footer() {
  const leagues = await getLeagues();

  const columns = [
    {
      title: "Shop",
      links: [{ href: "/shop", label: "All jerseys" }, ...leagues.map((l) => ({ href: `/leagues/${l.slug}`, label: l.name }))],
    },
    {
      title: "Your MatchKit",
      links: [
        { href: "/account", label: "Account & orders" },
        { href: "/wishlist", label: "Wishlist" },
        { href: "/cart", label: "Cart" },
        { href: "/login", label: "Log in / Register" },
      ],
    },
    {
      title: "Legal",
      links: [{ href: "/cookies", label: "Cookie policy" }],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/matchkit-logo.jpeg" alt="MatchKit" className="-ml-3 h-20 w-auto mix-blend-darken" />
          <p className="mt-1 text-sm leading-relaxed text-stone">
            Club and international football jerseys for the 2026/27 season. Prices in Naira, delivered across Nigeria.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="eyebrow mb-4 text-stone">{col.title}</h2>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  {/* py keeps each link a comfortable tap target on phones */}
                  <Link href={l.href} className="inline-block py-1.5 text-sm hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
          <span className="eyebrow text-[10px] text-stone">© {new Date().getFullYear()} MatchKit · All prices in ₦</span>
          <nav className="eyebrow flex justify-center gap-2 text-[10px] text-accent" aria-label="Quick links">
            <Link href="/cookies" className="py-1 hover:text-ink">
              Cookies
            </Link>
            <span className="py-1 text-stone">/</span>
            <Link href="/shop" className="py-1 hover:text-ink">
              Shop
            </Link>
            <span className="py-1 text-stone">/</span>
            <Link href="/account" className="py-1 hover:text-ink">
              Account
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
