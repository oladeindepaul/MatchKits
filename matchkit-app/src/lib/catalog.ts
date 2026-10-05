import { supabase } from './supabase';
import { storageUrl } from './format';

export type League = { id: number; slug: string; name: string; shortName: string; logo: string | null; order: number };
export type Club = { id: number; slug: string; name: string; logo: string | null; league: League };
export type Product = {
  id: number;
  slug: string;
  name: string;
  kitType: 'home' | 'away' | 'third';
  season: string;
  price: number;
  description: string | null;
  featured: boolean;
  image: string | null;
  sizes: { size: string; inStock: boolean }[];
  club: Club;
};

type LeagueRow = { id: number; slug: string; name: string; short_name: string; logo_path: string | null; sort_order: number };
type ClubRow = { id: number; slug: string; name: string; logo_path: string | null; leagues: LeagueRow };
type ProductRow = {
  id: number;
  slug: string;
  name: string;
  kit_type: Product['kitType'];
  season: string;
  price: number;
  description: string | null;
  is_featured: boolean;
  product_images: { path: string; position: number }[];
  product_sizes: { size: string; in_stock: boolean }[];
  clubs: ClubRow;
};

const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];
const KIT_ORDER = ['home', 'away', 'third'];

const toLeague = (l: LeagueRow): League => ({
  id: l.id,
  slug: l.slug,
  name: l.name,
  shortName: l.short_name,
  logo: storageUrl(l.logo_path),
  order: l.sort_order,
});
const toClub = (c: ClubRow): Club => ({ id: c.id, slug: c.slug, name: c.name, logo: storageUrl(c.logo_path), league: toLeague(c.leagues) });

function toProduct(p: ProductRow): Product {
  const path = [...p.product_images].sort((a, b) => a.position - b.position)[0]?.path;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    kitType: p.kit_type,
    season: p.season,
    price: p.price,
    description: p.description,
    featured: p.is_featured,
    image: storageUrl(path),
    sizes: p.product_sizes
      .map((s) => ({ size: s.size, inStock: s.in_stock }))
      .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    club: toClub(p.clubs),
  };
}

const LEAGUE_COLS = 'id, slug, name, short_name, logo_path, sort_order';

// The whole catalog (under 100 jerseys) loads in one go, the same query the website uses.
export async function fetchCatalog() {
  const [products, leagues, clubs] = await Promise.all([
    supabase
      .from('products')
      .select(
        `id, slug, name, kit_type, season, price, description, is_featured,
         product_images(path, position), product_sizes(size, in_stock),
         clubs!inner(id, slug, name, logo_path, leagues!inner(${LEAGUE_COLS}))`
      ),
    supabase.from('leagues').select(LEAGUE_COLS).order('sort_order'),
    supabase.from('clubs').select(`id, slug, name, logo_path, leagues!inner(${LEAGUE_COLS})`).order('name'),
  ]);
  const error = products.error || leagues.error || clubs.error;
  if (error) throw new Error(error.message);

  return {
    products: (products.data as unknown as ProductRow[])
      .map(toProduct)
      .sort(
        (a, b) =>
          a.club.league.order - b.club.league.order ||
          a.club.name.localeCompare(b.club.name) ||
          KIT_ORDER.indexOf(a.kitType) - KIT_ORDER.indexOf(b.kitType)
      ),
    leagues: (leagues.data as LeagueRow[]).map(toLeague),
    clubs: (clubs.data as unknown as ClubRow[]).map(toClub),
  };
}

export type Filters = { q?: string; league?: string; club?: string; kit?: string; price?: string; sort?: string };

export function filterProducts(products: Product[], f: Filters, ranges: readonly { value: string; min?: number; max?: number }[]) {
  const range = ranges.find((r) => r.value === f.price);
  const terms = (f.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const out = products.filter((p) => {
    if (f.league && p.club.league.slug !== f.league) return false;
    if (f.club && p.club.slug !== f.club) return false;
    if (f.kit && p.kitType !== f.kit) return false;
    if (range?.min != null && p.price < range.min) return false;
    if (range?.max != null && p.price > range.max) return false;
    if (terms.length) {
      const hay = [p.name, p.club.name, p.club.league.name, p.club.league.shortName, p.kitType]
        .join(' ')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  if (f.sort === 'price-asc') out.sort((a, b) => a.price - b.price);
  if (f.sort === 'price-desc') out.sort((a, b) => b.price - a.price);
  if (f.sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
