import { defineComponent, h } from "vue";
import { createApp, renderToString } from "@vue-tui/runtime";
import App from "./App.vue";
import { collectAll } from "./lib/collectors";

const args = process.argv.slice(2);

async function realSnapshot() {
  // Prime the delta-based collectors (cpu/net/disk), wait a beat, then take the
  // real reading the deltas are measured against.
  await collectAll();
  await new Promise((r) => setTimeout(r, 700));
  return collectAll();
}

if (args.includes("--json")) {
  // Machine-readable snapshot: raw Metrics as JSON. Drives scripts/verify.mjs and
  // is handy for piping into jq. No TTY needed.
  const snapshot = await realSnapshot();
  process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
  process.exit(0);
} else if (args.includes("--once") || args.includes("--snapshot")) {
  // One-shot: prime the delta-based collectors, take a real reading, render a
  // single frame to stdout, and exit. Useful for piping, CI, or a quick glance —
  // and it needs no interactive TTY.
  const snapshot = await realSnapshot();

  const columns = Number(process.env.COLUMNS) || process.stdout.columns || 120;
  const Snapshot = defineComponent({
    name: "MachudSnapshot",
    setup: () => () => h(App, { snapshot, columns }),
  });
  process.stdout.write(renderToString(Snapshot, { columns }) + "\n");
  process.exit(0);
} else {
  // alternateScreen: take over the terminal on a clean buffer (like btop/htop)
  // and restore the user's shell + scrollback on exit. Auto-ignored when not a
  // TTY, so piping still works.
  createApp(App).mount({ alternateScreen: true });
}
