import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      // Dev-only passthrough to MTA GTFS-RT feeds (matches the production
      // Cloudflare Worker at workers/mta-relay). The MTA endpoints speak
      // protobuf and don't return CORS headers, so we front them locally.
      "/mta": {
        target: "https://api-endpoint.mta.info",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/mta/, "/Dataservice/mtagtfsfeeds"),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: "PULSE — NYC MTA Live",
        short_name: "PULSE",
        description: "One glance, one answer. NYC MTA commute optimizer.",
        theme_color: "#0A0A0B",
        background_color: "#0A0A0B",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            // OpenFreeMap vector tiles
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "tile-cache",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // MTA feeds via relay — short TTL, stale-while-revalidate.
            urlPattern: /\/mta\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "mta-feed",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
            },
          },
        ],
      },
    }),
  ],
});
