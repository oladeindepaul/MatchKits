// Every price in MatchKit is whole Nigerian Naira.
const naira = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatNaira(amount: number) {
  return `₦${naira.format(amount)}`;
}

export function storageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/matchkit/${path}`;
}

export const KIT_LABELS: Record<string, string> = { home: "Home", away: "Away", third: "Third" };

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export const PRICE_RANGES = [
  { value: "under-25000", label: "Up to ₦25,000", min: undefined, max: 25000 },
  { value: "25000-30000", label: "₦25,000 – ₦30,000", min: 25000, max: 30000 },
  { value: "35000-plus", label: "₦35,000 and above", min: 35000, max: undefined },
] as const;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}
