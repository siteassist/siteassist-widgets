import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  appType: "mpa",
  base: "/",
  environments: {
    client: {
      build: {
        rollupOptions: {
          external: ["react", "react-dom"],
          input: {
            main: resolve(__dirname, "index.html"),
            chat: resolve(__dirname, "chat.html"),
            "chat-preview": resolve(__dirname, "chat-preview.html"),
          },
          output: {
            manualChunks: {
              streamdown: ["streamdown"],
            },
          },
        },
      },
    },
  },
});
