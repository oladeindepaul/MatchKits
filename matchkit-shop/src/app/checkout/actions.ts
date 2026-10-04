"use server";

import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation, type EmailOrder, type EmailOrderItem } from "@/lib/email";
import { SIZES } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/states";

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  lines: { productId: number; size: string; quantity: number }[];
};

export type CheckoutResult = { ok: true; orderId: string; emailSent: boolean } | { ok: false; error: string; fields?: Partial<Record<keyof CheckoutInput, string>> };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const data = {
    name: input.name?.trim() ?? "",
    email: input.email?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() ?? "",
    city: input.city?.trim() ?? "",
    state: input.state?.trim() ?? "",
  };

  const fields: Partial<Record<keyof CheckoutInput, string>> = {};
  if (data.name.length < 2) fields.name = "Enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(data.email)) fields.email = "Enter a valid email address";
  if (!/^\+?[0-9 ()-]{7,20}$/.test(data.phone)) fields.phone = "Enter a valid phone number";
  if (data.address.length < 5) fields.address = "Enter your delivery address";
  if (data.city.length < 2) fields.city = "Enter your city or town";
  if (!NIGERIAN_STATES.includes(data.state)) fields.state = "Choose your state";
  if (Object.keys(fields).length) return { ok: false, error: "Please check the highlighted fields.", fields };

  const lines = (input.lines ?? []).filter(
    (l) => Number.isInteger(l.productId) && SIZES.includes(l.size as (typeof SIZES)[number]) && Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= 20
  );
  if (lines.length === 0) return { ok: false, error: "Your cart is empty." };

  // Make the saved cart match exactly what the shopper sees, then let the database build the order
  // from it. place_order() reads prices from the products table, so totals can't be tampered with.
  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
  if (clearError) return { ok: false, error: "Could not prepare your order. Please try again." };

  const { error: cartError } = await supabase.from("cart_items").insert(
    lines.map((l) => ({ user_id: user.id, product_id: l.productId, size: l.size, quantity: l.quantity }))
  );
  if (cartError) return { ok: false, error: "Some items in your cart are no longer available. Please review your cart." };

  const { data: orderId, error: orderError } = await supabase.rpc("place_order", {
    p_customer_name: data.name,
    p_email: data.email,
    p_phone: data.phone,
    p_address: data.address,
    p_city: data.city,
    p_state: data.state,
  });
  if (orderError || !orderId) return { ok: false, error: "We couldn't place your order. Please try again." };

  // Remember details for next time (best effort).
  await supabase.from("profiles").update({ full_name: data.name, phone: data.phone }).eq("id", user.id);

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("order_number, customer_name, email, address, city, state, total, subtotal, created_at").eq("id", orderId).single(),
    supabase.from("order_items").select("product_name, club_name, kit_type, image_path, size, quantity, unit_price, line_total").eq("order_id", orderId).order("id"),
  ]);

  // The order is already saved; a failed email (e.g. a free email plan rejecting an
  // unauthorized recipient) is logged and reported, but never undoes the order.
  let emailSent = false;
  if (order && items) {
    const mailError = await sendOrderConfirmation(order as EmailOrder, items as EmailOrderItem[]);
    if (mailError) console.error(`[checkout] Confirmation email for ${order.order_number} failed: ${mailError}`);
    emailSent = !mailError;
  }

  return { ok: true, orderId: orderId as string, emailSent };
}
