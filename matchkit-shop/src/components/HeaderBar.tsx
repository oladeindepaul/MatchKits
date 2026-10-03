"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "./Icons";

type LeagueLink = { slug: string; name: string; logo: string | null };

export function HeaderBar({ signedIn, leagues }: { signedIn: boolean; leagues: LeagueLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const wishlist = useWishlist();

  // Close overlays when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream pt-[env(safe-area-inset-top)]">
      {/* Phones: menu + search on the left, cart on the right, so the centred logo fits even on a folded Galaxy Fold (280px). */}
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-8">
        <div className="-ml-2 flex items-center sm:gap-3">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid size-10 place-items-center hover:text-accent">
            <MenuIcon />
          </button>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="grid size-10 place-items-center hover:text-accent sm:hidden"
          >
            <SearchIcon />
          </button>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/shop" className="eyebrow py-2 hover:text-accent">
              Shop
            </Link>
            <Link href="/leagues" className="eyebrow py-2 hover:text-accent">
              Leagues
            </Link>
          </nav>
        </div>

        {/* The logo file has wide cream margins, so it is drawn large and clipped to the header height. */}
        <Link href="/" aria-label="MatchKit home" className="flex h-16 items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/matchkit-logo.jpeg"
            alt="MatchKit"
            className="h-[60px] w-auto max-w-none mix-blend-darken min-[360px]:h-[72px] sm:h-[88px]"
          />
        </Link>

        <div className="-mr-2 flex items-center justify-end sm:gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="hidden size-10 place-items-center hover:text-accent sm:grid"
          >
            <SearchIcon />
          </button>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden size-10 place-items-center hover:text-accent sm:grid">
            <HeartIcon />
            {wishlist.count > 0 && (
              <span className="absolute right-1 top-1.5 text-[9px] font-semibold text-accent">{wishlist.count}</span>
            )}
          </Link>
          <Link
            href={signedIn ? "/account" : "/login"}
            aria-label={signedIn ? "Your account" : "Log in"}
            className="hidden size-10 place-items-center hover:text-accent sm:grid"
          >
            <UserIcon />
          </Link>
          <Link href="/cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`} className="eyebrow flex h-10 items-center gap-1 px-2 hover:text-accent">
            <BagIcon className="size-[18px] sm:hidden" />
            <span className="hidden sm:inline">Cart</span>
            <span className="text-accent">({count})</span>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <Suspense>
          <SearchBar onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>

    {/* Rendered outside <header> so the overlay always covers the whole screen. */}
    {menuOpen && <MenuDrawer leagues={leagues} signedIn={signedIn} onClose={() => setMenuOpen(false)} />}
    </>
  );
}

function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
        onClose();
      }}
      className="border-t border-line/70 bg-paper"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
        <SearchIcon className="size-4 shrink-0 text-stone" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="Search jerseys, clubs or leagues, e.g. Arsenal away"
          aria-label="Search jerseys"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-stone"
        />
        <button type="submit" className="eyebrow text-accent">
          Search
        </button>
        <button type="button" onClick={onClose} aria-label="Close search" className="p-1 text-stone">
          <CloseIcon className="size-4" />
        </button>
      </div>
    </form>
  );
}

function MenuDrawer({ leagues, signedIn, onClose }: { leagues: LeagueLink[]; signedIn: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="absolute inset-y-0 left-0 flex h-dvh w-[min(360px,88vw)] flex-col overflow-y-auto overscroll-contain bg-paper py-6 pl-[max(2rem,env(safe-area-inset-left))] pr-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mb-10 flex items-center justify-between">
          <span className="eyebrow text-stone">Menu</span>
          <button onClick={onClose} aria-label="Close menu" className="-mr-2 grid size-10 place-items-center">
            <CloseIcon />
          </button>
        </div>

        <Link href="/shop" className="mb-1 py-1 text-2xl font-light">
          All jerseys
        </Link>
        <Link href="/leagues" className="mb-8 py-1 text-2xl font-light">
          Leagues &amp; clubs
        </Link>

        <span className="eyebrow mb-4 text-stone">Leagues</span>
        <ul className="mb-10 space-y-1">
          {leagues.map((l) => (
            <li key={l.slug}>
              <Link href={`/leagues/${l.slug}`} className="flex items-center gap-3 py-1.5 text-sm hover:text-accent">
                <span className="grid size-7 place-items-center">
                  {l.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.logo} alt="" className="size-7 object-contain" />
                  ) : (
                    <span className="text-[10px] font-semibold">INT</span>
                  )}
                </span>
                {l.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-1 border-t border-line pt-6 text-sm">
          <Link href="/wishlist" className="block py-2 hover:text-accent">
            Wishlist
          </Link>
          <Link href="/cart" className="block py-2 hover:text-accent">
            Cart
          </Link>
          <Link href={signedIn ? "/account" : "/login"} className="block py-2 hover:text-accent">
            {signedIn ? "My account & orders" : "Log in / Register"}
          </Link>
          <Link href="/cookies" className="block py-2 text-stone hover:text-accent">
            Cookie policy
          </Link>
        </div>
      </div>
    </div>
  );
}
