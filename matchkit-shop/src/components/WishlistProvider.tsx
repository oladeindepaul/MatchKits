"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type WishlistContextValue = {
  has: (productId: number) => boolean;
  toggle: (productId: number) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

// Wishlists belong to an account, so signed-out shoppers are sent to log in first.
export function WishlistProvider({
  userId,
  initialIds,
  children,
}: {
  userId: string | null;
  initialIds: number[];
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState(() => new Set(initialIds));
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  // Pick up hearts added or removed elsewhere (the mobile app, another tab).
  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_id");
      if (!error) setIds(new Set((data ?? []).map((r) => r.product_id as number)));
    };
    const channel = supabase
      .channel(`wishlist-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wishlist_items", filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, supabase]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!userId) {
        router.push(`/login?next=${encodeURIComponent(pathname)}&reason=wishlist`);
        return;
      }

      const adding = !ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (adding) next.add(productId);
        else next.delete(productId);
        return next;
      });

      const { error } = adding
        ? await supabase.from("wishlist_items").upsert({ user_id: userId, product_id: productId })
        : await supabase.from("wishlist_items").delete().match({ user_id: userId, product_id: productId });

      if (error) {
        // Undo the optimistic change if saving failed.
        setIds((prev) => {
          const next = new Set(prev);
          if (adding) next.delete(productId);
          else next.add(productId);
          return next;
        });
        return;
      }
      if (pathname === "/wishlist") router.refresh();
    },
    [userId, ids, supabase, router, pathname]
  );

  const value = useMemo(() => ({ has: (id: number) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
