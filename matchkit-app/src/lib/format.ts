// Every price in MatchKit is whole Nigerian Naira.
export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-US')}`;
}

export function storageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/matchkit/${path}`;
}

export const KIT_LABELS: Record<string, string> = { home: 'Home', away: 'Away', third: 'Third' };

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export const MAX_QTY = 20;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const PRICE_RANGES = [
  { value: 'under-25000', label: 'Up to ₦25,000', min: undefined, max: 25000 },
  { value: '25000-30000', label: '₦25,000 – ₦30,000', min: 25000, max: 30000 },
  { value: '35000-plus', label: '₦35,000+', min: 35000, max: undefined },
] as const;

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// The live website: the app uses it for checkout (so the confirmation email is sent from a server)
// and as the landing page for email verification links.
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || '').replace(/\/$/, '');
