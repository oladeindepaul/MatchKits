import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const nextConfig: NextConfig = {
  images: {
    // Jersey images and logos live in the public "matchkit" Supabase storage bucket.
    remotePatterns: [new URL(`${supabaseUrl}/storage/v1/object/public/matchkit/**`)],
    // The photos are already small JPEGs served from Supabase's CDN, so browsers load them directly
    // instead of routing every image through the Next.js server.
    unoptimized: true,
  },
};

export default nextConfig;
