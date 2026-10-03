"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "./Icons";

export type HeroSlide = {
  slug: string;
  club: string;
  league: string;
  kit: string;
  price: string;
  image: string | null;
  blurb: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// The Alpine-style hero: one featured jersey at a time, with a numbered pager.
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index];

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearTimeout(t);
  }, [index, paused, slides.length]);

  if (!slide) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-paper to-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured jerseys"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-8 sm:px-8 md:min-h-[520px] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:pb-14 md:pt-10">
        <div key={`text-${slide.slug}`} className="order-2 animate-[fade_600ms_ease] md:order-1">
          <p className="eyebrow mb-4 text-stone">
            {slide.league} · {slide.kit} kit 26/27
          </p>
          <h1 className="text-3xl font-medium sm:text-4xl">
            <span className="font-light text-stone">/ </span>
            {slide.club}
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/80">{slide.blurb}</p>
          <Link href={`/products/${slide.slug}`} className="btn-outline mt-8">
            Buy {slide.price}
          </Link>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:mt-20">
            <Link href={`/products/${slide.slug}`} className="eyebrow flex items-center gap-2 whitespace-nowrap text-[10px] hover:text-accent">
              <ChevronDown className="size-3" /> Product details
            </Link>
            <div className="flex items-center gap-3 text-[11px] font-medium tabular-nums">
              <button onClick={() => go(-1)} aria-label="Previous jersey" className="-m-1 p-2 text-stone hover:text-ink">
                <ArrowLeft className="w-6" />
              </button>
              <span>{pad(index + 1)}</span>
              <span className="relative h-px w-14 bg-line">
                <span
                  className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500"
                  style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                />
              </span>
              <span className="text-stone">{pad(slides.length)}</span>
              <button onClick={() => go(1)} aria-label="Next jersey" className="-m-1 p-2 text-accent hover:text-ink">
                <ArrowRight className="w-9" />
              </button>
            </div>
          </div>
        </div>

        <Link
          href={`/products/${slide.slug}`}
          key={`img-${slide.slug}`}
          className="relative order-1 mx-auto aspect-square w-full max-w-[520px] animate-[fade_700ms_ease] md:order-2"
          aria-label={`${slide.club} ${slide.kit} jersey`}
        >
          {slide.image && (
            <Image src={slide.image} alt="" fill priority sizes="(min-width: 768px) 520px, 90vw" className="object-cover" />
          )}
        </Link>
      </div>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </section>
  );
}
