import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    /** Do not emit source maps in production — reduces recoverability of original source from bundles. */
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "framer-motion";
            if (id.includes("three") || id.includes("@react-three"))
              return "three";
            if (id.includes("recharts")) return "recharts";
            if (id.includes("gsap")) return "gsap";
            if (id.includes("@radix-ui") || id.includes("/radix-ui/"))
              return "radix";
            if (id.includes("lucide-react")) return "lucide";
            if (id.includes("zustand")) return "zustand";
            if (id.includes("axios")) return "axios";
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      "/api": {
        // UPDATE THIS: Match your backend URL
        target: "http://localhost:8000", // or your deployed backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
