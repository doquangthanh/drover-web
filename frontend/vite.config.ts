import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { daemonTarget } from "./daemon-target.ts";

const { url, token } = daemonTarget();
const proxied = { target: url, changeOrigin: false };

export default defineConfig(({ command }) => {
  if (command === "serve" && !process.env.VITEST) { // vitest also runs as "serve": keep the token out of test output
    // The token is only logged to the terminal, never written to a file.
    console.log(`drover dev proxy -> ${url}\n  open http://localhost:5173/ui/${token ? `?token=${token}` : ""}`);
  }
  return {
    base: "/ui/",
    plugins: [react()],
    build: {
      outDir: "../src/drover/web_dist",
      emptyOutDir: true,
      target: ["es2020", "safari15"],
    },
    server: {
      port: 5173,
      proxy: {
        "/ws": { ...proxied, ws: true },
        "/rpc": proxied,
        "/static": proxied,
        "/health": proxied,
      },
    },
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
