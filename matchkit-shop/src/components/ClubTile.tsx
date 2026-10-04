import Link from "next/link";
import type { Club } from "@/lib/catalog";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ÿ]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function ClubTile({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex aspect-square flex-col items-center justify-center gap-2 bg-sand p-2 text-center sm:gap-3 sm:p-3 transition-colors hover:bg-[#e8e1d3]"
    >
      {/* Fixed pixel size on the image itself: crest SVGs declare very different natural sizes,
          and a percentage size inside a grid cell would let large ones spill over the name. */}
      {club.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={club.logo}
          alt=""
          className="size-12 shrink-0 object-contain transition-transform duration-500 group-hover:scale-110 min-[480px]:size-16 lg:size-20"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-ink/30 text-xs font-medium tracking-wider min-[480px]:size-16 lg:size-20">
          {initials(club.name)}
        </span>
      )}
      <span className="text-[11px] leading-tight sm:text-xs">{club.name}</span>
    </Link>
  );
}
