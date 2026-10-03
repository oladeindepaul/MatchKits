"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
