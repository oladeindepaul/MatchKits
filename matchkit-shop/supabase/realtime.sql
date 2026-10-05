-- Live cart and wishlist sync between the website and the mobile app.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- Broadcast changes on these tables to subscribed clients (Row Level Security still applies,
-- so each shopper only receives their own rows).
alter publication supabase_realtime add table public.cart_items, public.wishlist_items;

-- Include the full old row in delete events, so "user_id = me" filters also match removals.
alter table public.cart_items replica identity full;
alter table public.wishlist_items replica identity full;
