<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { Box, Text, useWindowSize, useInput, useApp } from "@vue-tui/runtime";
import { useMetrics } from "./composables/useMetrics";
import { emptyMetrics } from "./lib/empty";
import { theme, setThemeMode } from "./theme";
import type { Metrics } from "./types";
import HeaderBar from "./components/panels/HeaderBar.vue";
import CpuPanel from "./components/panels/CpuPanel.vue";
import MemoryPanel from "./components/panels/MemoryPanel.vue";
import GpuPanel from "./components/panels/GpuPanel.vue";
import DiskPanel from "./components/panels/DiskPanel.vue";
import NetworkPanel from "./components/panels/NetworkPanel.vue";
import BatteryPanel from "./components/panels/BatteryPanel.vue";
import SensorsPanel from "./components/panels/SensorsPanel.vue";

// `snapshot` is supplied only by the one-shot `--once` render. In normal use it's
// absent and the live poller drives everything.
const props = defineProps<{ snapshot?: Metrics }>();

const { metrics, history, now } = useMetrics();
const { columns } = useWindowSize();

const m = computed<Metrics>(() => props.snapshot ?? metrics.value ?? emptyMetrics());
const clockTs = computed(() => (props.snapshot ? props.snapshot.ts || Date.now() : now.value));
const width = computed(() => columns.value || 120);

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

watchEffect(() => setThemeMode(m.value.appearance.mode));

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
  });
} catch {
  // useInput is unavailable in one-shot render mode; ignore.
}
</script>

<template>
  <Box flexDirection="column" :width="width">
    <HeaderBar :m="m" :now="clockTs" />

    <Box flexDirection="row" :gap="1">
      <CpuPanel :cpu="m.cpu" :history="hist.cpu" />
      <MemoryPanel :memory="m.memory" :history="hist.mem" />
    </Box>

    <Box flexDirection="row" :gap="1">
      <GpuPanel :gpu="m.gpu" :history="hist.gpu" />
      <DiskPanel :disk="m.disk" />
      <NetworkPanel :net="m.net" :rx="hist.rx" :tx="hist.tx" />
    </Box>

    <Box flexDirection="row" :gap="1">
      <BatteryPanel :battery="m.battery" />
      <SensorsPanel :sensors="m.sensors" />
    </Box>

    <Box :paddingX="1">
      <Text :color="theme.dim">q quit · refresh 1s · zero-sudo · machud</Text>
    </Box>
  </Box>
</template>
