"use server";

import { createClient } from "@/lib/supabase/server";
import { checkout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout";

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };
  return checkout(supabase, user, input);
}
