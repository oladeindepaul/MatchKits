import type { Metadata, Viewport } from "next";
import "@fontsource-variable/jost"; // bundled locally so the site never waits on Google Fonts
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { CookieNotice } from "@/components/CookieNotice";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "MatchKit | Football Jerseys", template: "%s | MatchKit" },
  description: "Club and international football jerseys for the 2026/27 season, delivered across Nigeria.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the iPhone notch / Android cutouts; safe-area padding keeps content clear of them.
  viewportFit: "cover",
  themeColor: "#fef8ec",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlistIds: number[] = [];
  if (user) {
    const { data } = await supabase.from("wishlist_items").select("product_id");
    wishlistIds = (data ?? []).map((r) => r.product_id as number);
  }

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <CartProvider userId={user?.id ?? null}>
          <WishlistProvider userId={user?.id ?? null} initialIds={wishlistIds}>
            <Header signedIn={!!user} />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieNotice />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
