import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));

// machud is a terminal app: build it as a single Node ESM bundle that runs with
// `node dist/machud.mjs`. Dependencies stay external so Node resolves them at
// runtime instead of inlining the whole tree.
export default defineConfig({
  plugins: [vue()],
  build: {
    target: "node22",
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: `${here}src/main.ts`,
      formats: ["es"],
      fileName: () => "machud.mjs",
    },
    rollupOptions: {
      external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
      // Shebang so the bundle runs as the `machud` bin (e.g. `npx machud`). Node
      // strips this line from .mjs, so `node dist/machud.mjs` is unaffected. (D13)
      output: { banner: "#!/usr/bin/env node" },
    },
  },
});
