import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const inputPath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8080"
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: inputPath("./index.html"),
        nyxora: inputPath("./nyxora.html"),
        nyxoraLogin: inputPath("./nyxora-login.html")
      }
    }
  }
});
