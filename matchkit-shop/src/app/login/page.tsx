import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in or register" };

const REASONS: Record<string, string> = {
  checkout: "Log in or create an account to complete your order.",
  wishlist: "Log in to save jerseys to your wishlist.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  if (await getUser()) redirect(next);

  const reason = typeof sp.reason === "string" ? REASONS[sp.reason] : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const mode = sp.mode === "register" ? "register" : "login";

  return (
    <div className="mx-auto max-w-md px-4 pt-12 sm:pt-16">
      <LoginForm next={next} initialMode={mode} initialError={error} reason={reason} />
    </div>
  );
}
