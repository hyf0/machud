// Component-level render tests — the "verification layer" pattern borrowed from vue-tui
// (vuejs-ai/vue-tui), adapted to machud's runtime version.
//
// vue-tui's own suite uses @vue-tui/testing's `render()` → `lastFrame()`. That published
// package (0.0.3) is hard-pinned to @vue-tui/runtime@0.0.3, while machud runs runtime 0.1.0,
// so its frame-sink harness is version-mismatched here. Instead we render through the runtime's
// OWN synchronous `renderToString(component, { columns })` — the exact call `--once` uses — which
// matches 0.1.0 and needs no app/TTY. Panels are pure props→frame, so this covers them fully.
//
// These COMPLEMENT scripts/verify.mjs (build, packaging, npx, PTY, real-host collectors); here we
// isolate each panel and assert its rendered text across injected metric states — fast and granular.
import { test, expect } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { renderToString } from "@vue-tui/runtime";
import { emptyMetrics } from "../src/lib/empty";
import { setThemeMode } from "../src/theme";
import CpuPanel from "../src/components/panels/CpuPanel.vue";
import GpuPanel from "../src/components/panels/GpuPanel.vue";
import DiskPanel from "../src/components/panels/DiskPanel.vue";
import BatteryPanel from "../src/components/panels/BatteryPanel.vue";
import SensorsPanel from "../src/components/panels/SensorsPanel.vue";
import NarrowView from "../src/components/NarrowView.vue";

// Deterministic palette; we assert on ANSI-stripped text, so light/dark is irrelevant — but pin it.
setThemeMode("dark");

const M = emptyMetrics();
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
// Render any component with props to a plain-text frame (ANSI stripped) at a given width.
const frame = (comp: unknown, props: Record<string, unknown>, columns = 60): string =>
  strip(renderToString(defineComponent(() => () => h(comp as never, props)), { columns }));

test("GpuPanel renders its title and the usage %", () => {
  const f = frame(GpuPanel, { gpu: { ...M.gpu, usage: 43 }, history: Array(48).fill(43) });
  expect(f).toContain("GPU");
  expect(f).toContain("43%");
});

test("GpuPanel degrades to — when usage is unavailable (no sudo / no GPU reading)", () => {
  const f = frame(GpuPanel, { gpu: { ...M.gpu, usage: null }, history: Array(48).fill(0) });
  expect(f).toContain("GPU");
  expect(f).toContain("—");
});

test("DiskPanel shows the usage % and the earned FULL signal at 96%", () => {
  const ok = frame(DiskPanel, { disk: { ...M.disk, usedPct: 59 } });
  expect(ok).toContain("DISK");
  expect(ok).toContain("59%");
  expect(ok).not.toContain("FULL");
  const full = frame(DiskPanel, { disk: { ...M.disk, usedPct: 96 } });
  expect(full).toContain("FULL");
});

test("BatteryPanel reflects charge % when present and degrades when absent", () => {
  const present = frame(BatteryPanel, { battery: { ...M.battery, present: true, pct: 67 } });
  expect(present).toContain("BATTERY");
  expect(present).toContain("67%");
  const absent = frame(BatteryPanel, { battery: { ...M.battery, present: false, pct: 0 } });
  expect(absent).toContain("—"); // no battery → dashes in the optional rows, never a crash
});

test("SensorsPanel renders the thermal pressure value", () => {
  const f = frame(SensorsPanel, { sensors: { ...M.sensors, thermalPressure: "Fair" } });
  expect(f).toContain("SENSORS");
  expect(f).toContain("Fair");
});

test("CpuPanel renders its title and load average (plain text beside the block hero)", () => {
  const f = frame(CpuPanel, { cpu: { ...M.cpu, loadAvg: [1.23, 1, 1] }, history: Array(48).fill(10) });
  expect(f).toContain("CPU");
  expect(f).toContain("1.23");
});

test("NarrowView renders one compact, labeled line per module at watch-face width", () => {
  const m = {
    ...M,
    cpu: { ...M.cpu, usage: 44 },
    battery: { ...M.battery, present: true, pct: 71 },
  };
  const f = strip(renderToString(defineComponent(() => () => h(NarrowView, { m })), { columns: 40 }));
  expect(f).toContain("CPU 44%");
  expect(f).toContain("BAT 71%");
});
