import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { storageUrl } from "./format";

// The catalog is public, so it is read with the anon key and no user session.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

export type League = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  logo: string | null;
};

export type Club = {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  league: League;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  kitType: "home" | "away" | "third";
  season: string;
  price: number;
  description: string | null;
  featured: boolean;
  image: string | null;
  imagePath: string | null;
  sizes: { size: string; inStock: boolean }[];
  club: Club;
};

type LeagueRow = { id: number; slug: string; name: string; short_name: string; logo_path: string | null; sort_order: number };
type ClubRow = { id: number; slug: string; name: string; logo_path: string | null; leagues: LeagueRow };
type ProductRow = {
  id: number;
  slug: string;
  name: string;
  kit_type: Product["kitType"];
  season: string;
  price: number;
  description: string | null;
  is_featured: boolean;
  product_images: { path: string; position: number }[];
  product_sizes: { size: string; in_stock: boolean }[];
  clubs: ClubRow;
};

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];
const KIT_ORDER = ["home", "away", "third"];

const toLeague = (l: LeagueRow): League => ({
  id: l.id,
  slug: l.slug,
  name: l.name,
  shortName: l.short_name,
  logo: storageUrl(l.logo_path),
});

const toClub = (c: ClubRow): Club => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  logo: storageUrl(c.logo_path),
  league: toLeague(c.leagues),
});

function toProduct(p: ProductRow): Product {
  const imagePath = [...p.product_images].sort((a, b) => a.position - b.position)[0]?.path ?? null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    kitType: p.kit_type,
    season: p.season,
    price: p.price,
    description: p.description,
    featured: p.is_featured,
    image: storageUrl(imagePath),
    imagePath,
    sizes: p.product_sizes
      .map((s) => ({ size: s.size, inStock: s.in_stock }))
      .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    club: toClub(p.clubs),
  };
}

const LEAGUE_COLS = "id, slug, name, short_name, logo_path, sort_order";
const PRODUCT_COLS = `id, slug, name, kit_type, season, price, description, is_featured,
  product_images(path, position), product_sizes(size, in_stock),
  clubs!inner(id, slug, name, logo_path, leagues!inner(${LEAGUE_COLS}))`;

// The whole catalog is under 100 jerseys, so it is loaded once per request and filtered in memory.
export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLS).order("id");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const products = (data as unknown as ProductRow[]).map(toProduct);
  // League order, then club name, then home before away.
  return products.sort(
    (a, b) =>
      (a.club.league.id - b.club.league.id) ||
      a.club.name.localeCompare(b.club.name) ||
      KIT_ORDER.indexOf(a.kitType) - KIT_ORDER.indexOf(b.kitType)
  );
});

export const getLeagues = cache(async (): Promise<League[]> => {
  const { data, error } = await supabase.from("leagues").select(LEAGUE_COLS).order("sort_order");
  if (error) throw new Error(`Could not load leagues: ${error.message}`);
  return (data as LeagueRow[]).map(toLeague);
});

export const getClubs = cache(async (): Promise<Club[]> => {
  const { data, error } = await supabase
    .from("clubs")
    .select(`id, slug, name, logo_path, leagues!inner(${LEAGUE_COLS})`)
    .order("name");
  if (error) throw new Error(`Could not load clubs: ${error.message}`);
  return (data as unknown as ClubRow[]).map(toClub);
});

export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export type ProductFilters = {
  q?: string;
  league?: string;
  club?: string;
  kit?: string;
  min?: number;
  max?: number;
  sort?: string;
};

export function filterProducts(products: Product[], f: ProductFilters) {
  const terms = (f.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const result = products.filter((p) => {
    if (f.league && p.club.league.slug !== f.league) return false;
    if (f.club && p.club.slug !== f.club) return false;
    if (f.kit && p.kitType !== f.kit) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
    if (terms.length) {
      const haystack = [p.name, p.club.name, p.club.league.name, p.club.league.shortName, p.kitType, p.club.slug]
        .join(" ")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  if (f.sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") result.sort((a, b) => b.price - a.price);
  if (f.sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
