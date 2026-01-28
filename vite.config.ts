import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import * as child from "child_process"; // Import child_process

const commitHash = child
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Expose the commit hash as a global constant, stringified
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    hmr: {
      host: "localhost",
      protocol: "ws",
    },
  },
});
