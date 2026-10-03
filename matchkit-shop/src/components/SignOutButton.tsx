"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./CartProvider";

export function SignOutButton() {
  const router = useRouter();
  const { clear } = useCart();
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        clear(); // the cart stays saved in the account; just remove it from this browser
        router.replace("/");
        router.refresh();
      }}
      className="btn-outline"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
