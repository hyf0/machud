// Component render tests for the remaining panels (Memory / Network / HeaderBar), via the runtime's
// `renderToString` — same pattern as tests/panels.test.ts. Focus: per-panel content + states that
// are awkward to drive through the full --once frame (header-right slots, rate formatting, the
// two-tone wordmark, the wide↔narrow header branch).
import { test, expect } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { renderToString } from "@vue-tui/runtime";
import { emptyMetrics } from "../src/lib/empty";
import { setThemeMode } from "../src/theme";
import MemoryPanel from "../src/components/panels/MemoryPanel.vue";
import NetworkPanel from "../src/components/panels/NetworkPanel.vue";
import HeaderBar from "../src/components/panels/HeaderBar.vue";

setThemeMode("dark");
const M = emptyMetrics();
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const frame = (comp: unknown, props: Record<string, unknown>, columns = 60): string =>
  strip(renderToString(defineComponent(() => () => h(comp as never, props)), { columns }));

test("MemoryPanel shows title, used/total, pressure, and a top app", () => {
  const f = frame(MemoryPanel, {
    memory: {
      ...M.memory,
      usedPct: 60,
      used: 8 * 1024 ** 3,
      total: 16 * 1024 ** 3,
      wired: 2 * 1024 ** 3,
      swapUsed: 0,
      pressure: "Elevated",
      topApps: [{ name: "ZZAPP", bytes: 1024 ** 3 }],
    },
    history: Array(48).fill(60),
  });
  expect(f).toContain("MEMORY");
  expect(f).toContain("8.0 GB"); // used (header-right slot)
  expect(f).toContain("16.0 GB"); // total
  expect(f).toContain("Elevated"); // pressure label
  expect(f).toContain("ZZAPP"); // top app row
});

test("NetworkPanel shows the interface and rx/tx rates", () => {
  const f = frame(NetworkPanel, {
    net: { ...M.net, iface: "en0", rxBps: 3 * 1024 * 1024, txBps: 512 * 1024 },
    rx: Array(48).fill(1),
    tx: Array(48).fill(1),
  });
  expect(f).toContain("NETWORK");
  expect(f).toContain("en0");
  expect(f).toContain("▼ 3.0 MB/s");
  expect(f).toContain("▲ 512 KB/s");
});

test("HeaderBar renders the two-tone mac|hud wordmark, glance summary, and clock when wide", () => {
  const m = { ...M, cpu: { ...M.cpu, usage: 12 }, memory: { ...M.memory, usedPct: 60 } };
  const ts = new Date(2026, 0, 1, 9, 8, 7).getTime(); // local 09:08:07
  const wide = frame(HeaderBar, { m, now: ts, width: 120 }, 120);
  expect(wide).toContain("machud"); // mac + hud render adjacent (two-tone wordmark, D15)
  expect(wide).toContain("CPU 12%");
  expect(wide).toContain("09:08:07");
});

test("HeaderBar drops the glance summary at watch-face width (wordmark + clock only)", () => {
  const m = { ...M, cpu: { ...M.cpu, usage: 12 } };
  const ts = new Date(2026, 0, 1, 9, 8, 7).getTime();
  const narrow = frame(HeaderBar, { m, now: ts, width: 40 }, 40);
  expect(narrow).toContain("machud");
  expect(narrow).toContain("09:08:07");
  expect(narrow).not.toContain("CPU 12%");
});
