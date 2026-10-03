"use client";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
}) {
  return (
    <div className="flex h-11 items-center border border-line bg-paper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="h-full w-10 text-lg font-light disabled:text-stone/40"
      >
        −
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="h-full w-10 text-lg font-light disabled:text-stone/40"
      >
        +
      </button>
    </div>
  );
}
