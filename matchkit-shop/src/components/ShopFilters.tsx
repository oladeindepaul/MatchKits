"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PRICE_RANGES } from "@/lib/format";
import { SearchIcon } from "./Icons";

type Option = { value: string; label: string };
type Values = { q?: string; league?: string; club?: string; kit?: string; price?: string; sort?: string };

export function ShopFilters({
  values,
  leagues,
  clubs,
  count,
}: {
  values: Values;
  leagues: Option[];
  clubs: (Option & { league: string })[];
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // The shop page re-mounts this component (via key) when the search term in the URL changes.
  const [q, setQ] = useState(values.q ?? "");

  function update(changes: Partial<Values>) {
    const next = { ...values, ...changes };
    // A club belongs to one league, so changing league clears a club from another league.
    if (changes.league !== undefined && next.club && !clubs.some((c) => c.value === next.club && c.league === next.league)) {
      next.club = undefined;
    }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    startTransition(() => router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }

  const visibleClubs = values.league ? clubs.filter((c) => c.league === values.league) : clubs;
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="mb-8 space-y-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || undefined });
        }}
        className="flex items-center gap-3 border-b border-ink/80 pb-2"
      >
        <SearchIcon className="size-4 text-stone" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jerseys, clubs or leagues"
          aria-label="Search jerseys"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-stone"
        />
        <button type="submit" className="eyebrow text-accent">
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 md:grid-cols-5">
        <Select label="League" value={values.league} onChange={(v) => update({ league: v })} options={leagues} all="All leagues" />
        <Select label="Club" value={values.club} onChange={(v) => update({ club: v })} options={visibleClubs} all="All clubs" />
        <Select
          label="Kit"
          value={values.kit}
          onChange={(v) => update({ kit: v })}
          options={[
            { value: "home", label: "Home" },
            { value: "away", label: "Away" },
            { value: "third", label: "Third" },
          ]}
          all="Any kit"
        />
        <Select label="Price" value={values.price} onChange={(v) => update({ price: v })} options={[...PRICE_RANGES]} all="Any price" />
        <Select
          label="Sort"
          value={values.sort}
          onChange={(v) => update({ sort: v })}
          options={[
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
            { value: "name", label: "Name A–Z" },
          ]}
          all="By league"
          className="min-[340px]:col-span-2 md:col-span-1"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-stone">
        <span aria-live="polite">
          {pending ? "Updating…" : `${count} jersey${count === 1 ? "" : "s"}`}
        </span>
        {hasFilters && (
          <button onClick={() => startTransition(() => router.push(pathname, { scroll: false }))} className="eyebrow text-accent hover:text-ink">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all,
  className = "",
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  options: Option[];
  all: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className="field cursor-pointer py-2.5 pr-8">
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
