import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout&reason=checkout");

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-14">
      <h1 className="mb-10 text-3xl font-light sm:text-4xl">
        <span className="text-stone">/ </span>Checkout
      </h1>
      <CheckoutForm
        defaults={{
          name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
          email: user.email ?? "",
          phone: profile?.phone ?? "",
        }}
      />
    </div>
  );
}
