"use client";

import { useWishlist } from "./WishlistProvider";
import { HeartIcon } from "./Icons";

export function WishlistButton({ productId, withLabel = false }: { productId: number; withLabel?: boolean }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  const label = saved ? "Remove from wishlist" : "Add to wishlist";

  if (withLabel) {
    return (
      <button type="button" onClick={() => toggle(productId)} className="eyebrow flex items-center gap-2 hover:text-accent">
        <HeartIcon filled={saved} className={`size-4 ${saved ? "text-accent" : ""}`} />
        {saved ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={`grid size-9 place-items-center rounded-full transition-colors hover:bg-cream/70 ${saved ? "text-accent" : "text-stone hover:text-ink"}`}
    >
      <HeartIcon filled={saved} className="size-[17px]" />
    </button>
  );
}
