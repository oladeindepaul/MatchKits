import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkout, type CheckoutInput } from "@/lib/checkout";

// Checkout for the MatchKit mobile app. The app sends the shopper's Supabase access token as
// "Authorization: Bearer <token>", so the order is placed as that user under Row Level Security,
// with the same validation, database pricing and confirmation email as the website.
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false, error: "Your session has expired. Please log in again." }, { status: 401 });

  let input: CheckoutInput;
  try {
    input = (await request.json()) as CheckoutInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await checkout(supabase, user, input);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
