import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Next.js static assets
        urlPattern: /^https?.+\/_next\/static\/.+/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Public invite pages — cache-first so they work offline for guests
        urlPattern: /^https?.+\/i\/.+/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "invite-pages",
          expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Planning app pages — network-first with stale fallback
        urlPattern:
          /^https?.+\/(dashboard|[^/]+\/(overview|guests|tasks|events|settings)).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-pages",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Supabase API calls — network-first
        urlPattern: /^https?:\/\/[^/]+\.supabase\.co\/.+/,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
