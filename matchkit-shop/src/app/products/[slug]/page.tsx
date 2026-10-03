import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { formatNaira, KIT_LABELS } from "@/lib/format";
import { AddToCart } from "@/components/AddToCart";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductGrid } from "@/components/ProductCard";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product ? { title: product.name, description: product.description ?? undefined } : { title: "Jersey not found" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const kits = products.filter((p) => p.club.slug === product.club.slug);
  const related = products
    .filter((p) => p.club.league.slug === product.club.league.slug && p.club.slug !== product.club.slug && p.kitType === product.kitType)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8 sm:pt-10">
      <nav className="eyebrow flex flex-wrap gap-2 text-[10px] text-stone">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        <span>/</span>
        <Link href={`/leagues/${product.club.league.slug}`} className="hover:text-ink">
          {product.club.league.name}
        </Link>
        <span>/</span>
        <Link href={`/clubs/${product.club.slug}`} className="hover:text-ink">
          {product.club.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-14">
        <div className="relative aspect-square bg-sand">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-cover"
            />
          )}
          {product.club.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.club.logo} alt="" className="absolute left-5 top-5 h-10 w-10 object-contain opacity-90" />
          )}
        </div>

        <div className="md:pt-4">
          <p className="eyebrow mb-3 text-stone">
            {product.club.league.name} · {product.season}
          </p>
          <h1 className="text-3xl font-medium leading-tight">
            <span className="font-light text-stone">/ </span>
            {product.club.name}
          </h1>
          <p className="mt-1 text-lg font-light">{KIT_LABELS[product.kitType]} Jersey</p>
          <p className="mt-5 text-2xl">{formatNaira(product.price)}</p>

          {kits.length > 1 && (
            <div className="mt-8">
              <span className="label">Kit</span>
              <div className="flex gap-2">
                {kits.map((k) => (
                  <Link
                    key={k.slug}
                    href={`/products/${k.slug}`}
                    replace
                    scroll={false}
                    aria-current={k.slug === product.slug ? "page" : undefined}
                    className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${
                      k.slug === product.slug ? "border-ink bg-ink text-cream" : "border-line hover:border-ink"
                    }`}
                  >
                    {k.image && (
                      <Image src={k.image} alt="" width={28} height={28} className="size-7 object-cover" />
                    )}
                    {KIT_LABELS[k.kitType]}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <AddToCart
            key={product.slug}
            line={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              clubName: product.club.name,
              kitType: product.kitType,
              price: product.price,
              image: product.image,
            }}
            sizes={product.sizes}
          />

          <div className="mt-6">
            <WishlistButton productId={product.id} withLabel />
          </div>

          <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
            {[
              ["Club", <Link key="c" href={`/clubs/${product.club.slug}`} className="hover:text-accent">{product.club.name}</Link>],
              ["League", <Link key="l" href={`/leagues/${product.club.league.slug}`} className="hover:text-accent">{product.club.league.name}</Link>],
              ["Kit type", KIT_LABELS[product.kitType]],
              ["Season", product.season],
              ["Sizes", product.sizes.map((s) => s.size).join(", ")],
            ].map(([term, value]) => (
              <div key={term as string} className="flex justify-between py-3">
                <dt className="text-stone">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {product.description && <p className="mt-6 text-sm leading-relaxed text-ink/80">{product.description}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-6 text-xl font-light">
            <span className="text-stone">/ </span>You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
