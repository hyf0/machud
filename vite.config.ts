// defineConfig from "vite-plus" (not "vite") so the `test` key below is typed — vite-plus
// is the same Vite under the hood for `vp build`, plus the Vitest test layer for `vp test`.
import { defineConfig } from "vite-plus";
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
  // Component-test layer (`vp test`), borrowed from vue-tui's own setup. chalk emits no
  // colour in a non-TTY, so force it on; CI:"false" keeps vue-tui's interactive detection
  // (interactive = !isInCi && isTTY) from flipping off under the runner. Tests render panels
  // via the runtime's synchronous `renderToString` (see tests/). Complements scripts/verify.mjs,
  // which still owns build/packaging/npx/PTY and real-host collector coverage.
  test: {
    env: { FORCE_COLOR: "3", CI: "false" },
    // A browser-like environment is what flips Vitest to the WEB/client transform, so
    // @vitejs/plugin-vue compiles SFCs to a CLIENT render fn instead of `ssrRender`. The
    // runtime's `renderToString` is a TERMINAL renderer needing the client fn (what `vp
    // build` emits); under the default node/ssr transform SFCs throw "missing render function".
    // happy-dom's window/document go unused — we only want its transform mode. (vue-tui tests
    // in JSX so it never hits this; machud tests real .vue panels, which need client compile.)
    environment: "happy-dom",
  },
});
