import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the webpack config in remix.config.js
export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    hmr: process.env.SHOPIFY_APP_URL
      ? {
          protocol:  "wss",
          host:      new URL(process.env.SHOPIFY_APP_URL).hostname,
          port:      443,
        }
      : undefined,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist:     true,
        v3_relativeSplatPath:  true,
        v3_throwAbortReason:   true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch:        true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
}) satisfies UserConfig;
