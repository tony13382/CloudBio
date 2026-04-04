import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({
      configPath: "./wrangler.toml",
    }),
  ],
  server: {
    hmr: true,
    headers: {
      // Prevent caching index.html in dev
      "Cache-Control": "no-store",
    },
  },
});
