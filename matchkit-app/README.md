# MatchKit mobile app

The Android (and iOS) app for **MatchKit**, the football jersey shop. It shares one Supabase backend with the
[MatchKit website](https://matchkits.vercel.app) (`../matchkit-shop`), so the same account, cart, wishlist and
orders work on both.

Built with **Expo SDK 57 / React Native**, **Expo Router** and **Supabase**.

## Features

- Log in and register with the same email and password as the website (stays logged in)
- Home with featured jerseys, league chips and shop-by-league
- Shop with search and filters (league, club, kit, price, sort)
- League and club pages, product page with kit switcher, sizes and quantity
- **Cart synced with the website in both directions, live** (Supabase Realtime)
- Wishlist synced with the website
- Checkout and order confirmation (orders are placed through the website's `/api/checkout`, so the
  confirmation email and pricing rules are identical), order history in Account
- Bottom tabs with cart and wishlist badges, pull to refresh, haptics, MatchKit icon and splash screen
- All prices in Nigerian Naira (₦); no payment gateway

## How the sync works

When signed in, the cart lives in Supabase's `cart_items` table (one row per jersey and size). The website and
the app both read and write it, and both subscribe to changes, so an item added on one appears on the other
within a second or two. Row Level Security ensures each shopper only sees their own rows.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. On Windows PowerShell use `npx.cmd` instead of `npx`.

Configuration lives in `.env` (local) and `eas.json` (cloud builds); both hold only public values:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # publishable key, protected by Row Level Security
EXPO_PUBLIC_SITE_URL=https://matchkits.vercel.app
```

## Build the APK

```bash
npx eas-cli@latest build -p android --profile preview
```

## Project layout

```
src/app/            screens (Expo Router): (tabs)/ home, shop, wishlist, cart, account;
                    product/[slug], league/[slug], club/[slug], leagues, checkout, order/[id], login, register
src/providers/      auth, catalog, cart (synced), wishlist (synced)
src/components/     product card and grid, hero, club tile, chips, stepper, form fields
src/lib/            Supabase client, catalog queries, formatting
```
