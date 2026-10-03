import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatNaira, KIT_LABELS } from "@/lib/format";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="group relative bg-sand transition-colors hover:bg-[#e8e1d3]">
      <Link href={`/products/${product.slug}`} className="block p-2.5 sm:p-3">
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 340px, (min-width: 340px) 45vw, 90vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          )}
        </div>
        <div className="flex items-start justify-between gap-3 px-2 pb-3 pt-4 sm:px-3">

          <div className="min-w-0">
            <h3 className="truncate text-[13px] sm:text-sm">{product.club.name}</h3>
            <p className="mt-0.5 text-[11px] text-stone">
              {KIT_LABELS[product.kitType]} · {product.club.league.shortName}
            </p>
          </div>
          <p className="shrink-0 text-[13px] sm:text-sm">{formatNaira(product.price)}</p>
        </div>
      </Link>
      <div className="absolute right-4 top-4 rounded-full bg-paper/80 backdrop-blur-sm">
        <WishlistButton productId={product.id} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-7">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 3} />
      ))}
    </div>
  );
}
