// Builds the MatchKit catalog from the MatchKits asset folder.
//
//   npm run catalog:sql      -> writes supabase/seed.sql (no keys needed)
//   npm run catalog:upload   -> uploads logos + jerseys to the "matchkit" storage bucket
//                               (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
//
// The asset folder is only read, never modified. Folder names keep their original
// spelling on disk; the names shown on the site come from the maps below.

import fs from "node:fs";
import path from "node:path";

const ASSETS_DIR = process.env.MATCHKIT_ASSETS ?? "C:/Users/anuol/projects/MatchKits";
const BUCKET = "matchkit";
const SIZES = ["S", "M", "L", "XL", "XXL"];

// folder name -> league details. Price applies to every jersey in the league unless the club overrides it.
const LEAGUES = {
  EPL: { slug: "epl", name: "Premier League", short: "EPL", price: null, order: 1 },
  Laliga: { slug: "laliga", name: "La Liga", short: "La Liga", price: 30000, order: 2 },
  "Serie A": { slug: "serie-a", name: "Serie A", short: "Serie A", price: 30000, order: 3 },
  Bundesliga: { slug: "bundesliga", name: "Bundesliga", short: "Bundesliga", price: 25000, order: 4 },
  "Ligue 1": { slug: "ligue-1", name: "Ligue 1", short: "Ligue 1", price: 25000, order: 5 },
  International: { slug: "international", name: "International", short: "International", price: 40000, order: 6 },
};

// folder name -> correct display name (and EPL price, ₦20,000–₦35,000).
const CLUBS = {
  // EPL
  Arsenal: { name: "Arsenal", price: 35000 },
  Chelsea: { name: "Chelsea", price: 35000 },
  Liverpool: { name: "Liverpool", price: 35000 },
  "Manchester City": { name: "Manchester City", price: 35000 },
  "Manchester United": { name: "Manchester United", price: 35000 },
  "Tottenham Hotspur": { name: "Tottenham Hotspur", price: 35000 },
  "Aston Villa": { name: "Aston Villa", price: 30000 },
  Newcastle: { name: "Newcastle United", price: 30000 },
  "Brighton Holves & Albion": { name: "Brighton & Hove Albion", price: 25000 },
  "Crystal Palace": { name: "Crystal Palace", price: 25000 },
  Everton: { name: "Everton", price: 25000 },
  Fulham: { name: "Fulham", price: 25000 },
  "Nottingham Forest": { name: "Nottingham Forest", price: 25000 },
  Bournemouth: { name: "AFC Bournemouth", price: 25000 },
  Brentford: { name: "Brentford", price: 25000 },
  "Leeds United": { name: "Leeds United", price: 20000 },
  Sunderland: { name: "Sunderland", price: 20000 },
  Coventry: { name: "Coventry City", price: 20000 },
  "Hull City": { name: "Hull City", price: 20000 },
  Ipswich: { name: "Ipswich Town", price: 20000 },
  // La Liga
  "Athletico Madrid": { name: "Atlético Madrid" },
  Barcelona: { name: "FC Barcelona" },
  "Real Madrid": { name: "Real Madrid" },
  Sevilla: { name: "Sevilla" },
  Villareal: { name: "Villarreal" },
  // Serie A
  "Ac Milan": { name: "AC Milan" },
  Como: { name: "Como 1907" },
  Fiorentina: { name: "Fiorentina" },
  "Inter Milan": { name: "Inter Milan" },
  Juventus: { name: "Juventus" },
  Napoli: { name: "Napoli" },
  // Bundesliga
  "Bayern Leverkusen 04": { name: "Bayer 04 Leverkusen" },
  "Bayern Munchen": { name: "Bayern München" },
  Dortmund: { name: "Borussia Dortmund" },
  "Eintract Frankfurt": { name: "Eintracht Frankfurt" },
  "RB Liepzig": { name: "RB Leipzig" },
  // Ligue 1
  "AS Monaco": { name: "AS Monaco" },
  "Lille OSC": { name: "LOSC Lille" },
  "Olympique Lyon": { name: "Olympique Lyonnais" },
  "Olympique Marseille": { name: "Olympique de Marseille" },
  PSG: { name: "Paris Saint-Germain" },
  // International
  Argentina: { name: "Argentina" },
  Brazil: { name: "Brazil" },
  England: { name: "England" },
  France: { name: "France" },
  Ghana: { name: "Ghana" },
  Morroco: { name: "Morocco" },
  Nigeria: { name: "Nigeria" },
  Portugal: { name: "Portugal" },
  Spain: { name: "Spain" },
};

// Big clubs get the hero slider on the home page.
const FEATURED = new Set(["arsenal-home", "real-madrid-home", "argentina-home", "fc-barcelona-home"]);

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isImage = (f) => /\.(jpe?g|png|webp)$/i.test(f);
const isLogo = (f) => /\.svg$/i.test(f) || /logo/i.test(f);
const nonEmpty = (p) => fs.statSync(p).size > 0;

function kitType(file) {
  const f = file.toLowerCase();
  if (f.includes("away")) return "away";
  if (f.includes("third")) return "third";
  return "home"; // "Home" or an unlabelled single jersey
}

const KIT_LABEL = { home: "Home", away: "Away", third: "Third" };

function buildCatalog() {
  const leagues = [];
  const skipped = [];

  for (const [folder, meta] of Object.entries(LEAGUES)) {
    const dir = path.join(ASSETS_DIR, folder);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const logoFile = entries.find((e) => e.isFile() && isLogo(e.name) && nonEmpty(path.join(dir, e.name)));

    const league = {
      ...meta,
      logo: logoFile && { src: path.join(dir, logoFile.name), dest: `leagues/${meta.slug}${path.extname(logoFile.name).toLowerCase()}` },
      clubs: [],
    };

    for (const clubDir of entries.filter((e) => e.isDirectory())) {
      const clubMeta = CLUBS[clubDir.name];
      if (!clubMeta) throw new Error(`No display name for club folder "${folder}/${clubDir.name}" — add it to CLUBS`);
      const cdir = path.join(dir, clubDir.name);
      const files = fs.readdirSync(cdir).filter((f) => nonEmpty(path.join(cdir, f)));
      const slug = slugify(clubMeta.name);
      const jerseys = files.filter((f) => isImage(f) && !isLogo(f));

      if (jerseys.length === 0) {
        skipped.push(`${clubMeta.name} (no jersey images)`);
        continue;
      }

      const logo = files.find(isLogo);
      const price = clubMeta.price ?? meta.price;
      if (!price) throw new Error(`No price for ${clubMeta.name}`);

      const products = [];
      for (const file of jerseys) {
        const kit = kitType(file);
        const pslug = `${slug}-${kit}`;
        if (products.some((p) => p.slug === pslug)) throw new Error(`Two ${kit} kits for ${clubMeta.name}: check file names`);
        products.push({
          slug: pslug,
          kit,
          name: `${clubMeta.name} ${KIT_LABEL[kit]} Jersey`,
          price,
          featured: FEATURED.has(pslug),
          image: { src: path.join(cdir, file), dest: `jerseys/${meta.slug}/${slug}/${pslug}${path.extname(file).toLowerCase()}` },
        });
      }
      products.sort((a, b) => Object.keys(KIT_LABEL).indexOf(a.kit) - Object.keys(KIT_LABEL).indexOf(b.kit));

      league.clubs.push({
        slug,
        name: clubMeta.name,
        logo: logo && { src: path.join(cdir, logo), dest: `clubs/${slug}${path.extname(logo).toLowerCase()}` },
        products,
      });
    }

    league.clubs.sort((a, b) => a.name.localeCompare(b.name));
    leagues.push(league);
  }

  return { leagues, skipped };
}

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

function toSql({ leagues }) {
  const out = [
    "-- Generated by scripts/catalog.mjs. Do not edit by hand; re-run `npm run catalog:sql`.",
    "begin;",
    "truncate public.product_sizes, public.product_images, public.products, public.clubs, public.leagues restart identity cascade;",
    "",
  ];

  for (const l of leagues) {
    out.push(
      `insert into public.leagues (slug, name, short_name, logo_path, sort_order) values (${q(l.slug)}, ${q(l.name)}, ${q(l.short)}, ${q(l.logo?.dest)}, ${l.order});`
    );
    for (const c of l.clubs) {
      out.push(
        `insert into public.clubs (league_id, slug, name, logo_path) select id, ${q(c.slug)}, ${q(c.name)}, ${q(c.logo?.dest)} from public.leagues where slug = ${q(l.slug)};`
      );
      for (const p of c.products) {
        const desc = `The official-style ${c.name} ${KIT_LABEL[p.kit].toLowerCase()} jersey for the 2026/27 season.`;
        out.push(
          `insert into public.products (club_id, slug, name, kit_type, price, description, is_featured) select id, ${q(p.slug)}, ${q(p.name)}, ${q(p.kit)}, ${p.price}, ${q(desc)}, ${p.featured} from public.clubs where slug = ${q(c.slug)};`,
          `insert into public.product_images (product_id, path, position) select id, ${q(p.image.dest)}, 0 from public.products where slug = ${q(p.slug)};`,
          `insert into public.product_sizes (product_id, size) select id, s from public.products, unnest(array[${SIZES.map(q).join(", ")}]) s where slug = ${q(p.slug)};`
        );
      }
    }
    out.push("");
  }

  out.push("commit;");
  return out.join("\n") + "\n";
}

async function upload({ leagues }) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const brandLogo = { src: path.join(ASSETS_DIR, "MatchKit Logo.jpeg"), dest: "brand/matchkit-logo.jpeg" }; // used in emails
  const files = [brandLogo, ...leagues.flatMap((l) => [l.logo, ...l.clubs.flatMap((c) => [c.logo, ...c.products.map((p) => p.image)])])].filter(Boolean);
  const types = { ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

  let done = 0;
  for (const f of files) {
    const { error } = await supabase.storage.from(BUCKET).upload(f.dest, fs.readFileSync(f.src), {
      contentType: types[path.extname(f.dest)],
      upsert: true,
    });
    if (error) throw new Error(`${f.dest}: ${error.message}`);
    console.log(`  [${++done}/${files.length}] ${f.dest}`);
  }
}

const catalog = buildCatalog();
const productCount = catalog.leagues.reduce((n, l) => n + l.clubs.reduce((m, c) => m + c.products.length, 0), 0);
const clubCount = catalog.leagues.reduce((n, l) => n + l.clubs.length, 0);
console.log(`${catalog.leagues.length} leagues, ${clubCount} clubs, ${productCount} jerseys`);
if (catalog.skipped.length) console.log(`Hidden: ${catalog.skipped.join(", ")}`);

if (process.argv.includes("--upload")) {
  await upload(catalog);
  console.log("Upload complete.");
} else {
  const outFile = path.join(import.meta.dirname, "..", "supabase", "seed.sql");
  fs.writeFileSync(outFile, toSql(catalog));
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
}
