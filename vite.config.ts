import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "fs";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-404",
      closeBundle() {
        // Copy 404.html to dist folder for S3 SPA routing
        try {
          copyFileSync(resolve(__dirname, "404.html"), resolve(__dirname, "dist/404.html"));
          console.log("✓ Copied 404.html to dist/");
        } catch (err) {
          console.warn("Warning: Could not copy 404.html:", err);
        }
      },
    },
  ],
  base: "/",
});
