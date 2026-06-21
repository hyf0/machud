<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { Box, Text, useWindowSize, useInput, useApp } from "@vue-tui/runtime";
import { useMetrics } from "./composables/useMetrics";
import { emptyMetrics } from "./lib/empty";
import { theme, setThemeMode, nextThemeMode, type ThemeOverride } from "./theme";
import type { Metrics } from "./types";
import HeaderBar from "./components/panels/HeaderBar.vue";
import CpuPanel from "./components/panels/CpuPanel.vue";
import MemoryPanel from "./components/panels/MemoryPanel.vue";
import GpuPanel from "./components/panels/GpuPanel.vue";
import DiskPanel from "./components/panels/DiskPanel.vue";
import NetworkPanel from "./components/panels/NetworkPanel.vue";
import BatteryPanel from "./components/panels/BatteryPanel.vue";
import SensorsPanel from "./components/panels/SensorsPanel.vue";
import NarrowView from "./components/NarrowView.vue";

// `snapshot` + `columns` are supplied only by the one-shot `--once` render. `columns` lets the verify
// gate drive the responsive width (the --once path has no TTY width); live, the poller + useWindowSize
// (reactive) drive everything.
const props = defineProps<{ snapshot?: Metrics; columns?: number }>();

const { metrics, history, now } = useMetrics();
const { columns } = useWindowSize();

const m = computed<Metrics>(() => props.snapshot ?? metrics.value ?? emptyMetrics());
const clockTs = computed(() => (props.snapshot ? props.snapshot.ts || Date.now() : now.value));
// Responsive width seam (D4/RD5): prefer the explicit prop (gate / --once), else the live terminal
// width. The v-if below branches on THIS, so a breakpoint asserted at COLUMNS=40/120 is the width the
// code actually branches on.
const width = computed(() => props.columns || columns.value || 120);

// The one-shot `--once` render has no rolling history, so the graphs would be blank. Show a flat
// band at the current reading — honest (no invented trend) and enough to render a representative
// frame. The live app uses the real rolling history.
const hist = computed(() => {
  if (!props.snapshot) return history.value;
  const s = props.snapshot;
  const flat = (v: number) => Array.from({ length: 48 }, () => v);
  return {
    cpu: flat(s.cpu.usage),
    gpu: flat(s.gpu.usage ?? 0),
    mem: flat(s.memory.usedPct),
    rx: flat(s.net.rxBps),
    tx: flat(s.net.txBps),
  };
});

// Manual theme override (D16, owner-vouched): default `auto` follows the macOS
// appearance (D8); `t` cycles auto→light→dark→auto. It's ephemeral — never
// persisted. The test seam applies the SAME cycle N times from `auto`, so the
// --once gate exercises the exact key-press contract without a live keyboard.
const seedPresses = Number(process.env.MACHUD_TEST_THEME_PRESSES);
const themeOverride = ref<ThemeOverride>("auto");
if (Number.isFinite(seedPresses) && seedPresses > 0) {
  for (let i = 0; i < seedPresses; i++) themeOverride.value = nextThemeMode(themeOverride.value);
}
// `auto` follows the system reading; an explicit light/dark wins over it.
const effectiveMode = computed(() =>
  themeOverride.value === "auto" ? m.value.appearance.mode : themeOverride.value,
);
watchEffect(() => setThemeMode(effectiveMode.value));

// Exit cleanly via the app lifecycle so the alternate screen is restored on quit.
// Ctrl+C is handled by mount's exitOnCtrlC. Both useApp/useInput are unavailable
// in the one-shot render path, so guard them.
let quit = () => process.exit(0);
try {
  const app = useApp();
  quit = () => app.exit();
} catch {
  // not in an interactive app context (one-shot render); keep the fallback.
}
try {
  useInput((input) => {
    if (input === "q") quit();
    else if (input === "t") themeOverride.value = nextThemeMode(themeOverride.value);
  });
} catch {
  // useInput is unavailable in one-shot render mode; ignore.
}
</script>

<template>
  <Box flexDirection="column" :width="width">
    <HeaderBar :m="m" :now="clockTs" :width="width" />

    <!-- Wide (default): the full 3-tier hierarchy. Narrow/watch-face: a single compact column. One
         breakpoint (D4) — the gate tests hero-present@120 and hero-absent@40. -->
    <template v-if="width >= 100">
      <Box flexDirection="row" :gap="1">
        <CpuPanel :cpu="m.cpu" :history="hist.cpu" />
        <MemoryPanel :memory="m.memory" :history="hist.mem" />
      </Box>

      <Box flexDirection="row" :gap="1">
        <NetworkPanel :net="m.net" :rx="hist.rx" :tx="hist.tx" />
        <BatteryPanel :battery="m.battery" />
        <GpuPanel :gpu="m.gpu" :history="hist.gpu" />
      </Box>

      <Box flexDirection="row" :gap="1">
        <DiskPanel :disk="m.disk" />
        <SensorsPanel :sensors="m.sensors" />
      </Box>
    </template>

    <NarrowView v-else :m="m" />

    <Box :paddingX="1">
      <Text :color="theme.dim">{{ width >= 100 ? "q quit · t theme · refresh 1s" : "q quit · t theme" }}</Text>
    </Box>
  </Box>
</template>
