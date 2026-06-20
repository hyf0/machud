<script setup lang="ts">
// Narrow / watch-face fallback (RD5, D4): a single compact column — one line per module, no hero
// BigNumber/graphs (those need width). The hierarchy IS the degradation: the heavy hero ink drops,
// the glanceable numbers stay. Shown below the responsive breakpoint in App.vue.
import { Box, Text } from "@vue-tui/runtime";
import Bar from "./Bar.vue";
import { theme } from "../theme";
import { pct, humanBytes } from "../lib/format";
import type { Metrics } from "../types";

defineProps<{ m: Metrics }>();
</script>

<template>
  <Box flexDirection="column" :paddingX="1">
    <Box justifyContent="space-between">
      <Text :color="theme.cpu">CPU {{ pct(m.cpu.usage) }}</Text>
      <Box><Bar :value="m.cpu.usage" :width="10" /></Box>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.mem">MEM {{ pct(m.memory.usedPct) }}</Text>
      <Box><Bar :value="m.memory.usedPct" :width="10" /></Box>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.gpu">GPU {{ pct(m.gpu.usage) }}</Text>
      <Box><Bar :value="m.gpu.usage ?? 0" :width="10" :color="theme.accent" /></Box>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.disk">DISK {{ pct(m.disk.usedPct) }}</Text>
      <Box><Bar :value="m.disk.usedPct" :width="10" /></Box>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.net">NET</Text>
      <Text :color="theme.dim">▼{{ humanBytes(m.net.rxBps, true) }} ▲{{ humanBytes(m.net.txBps, true) }}</Text>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.battery">BAT {{ pct(m.battery.pct) }}</Text>
      <Text :color="theme.dim">{{ m.battery.charging ? "⇡ charging" : m.battery.present ? "on AC" : "—" }}</Text>
    </Box>
  </Box>
</template>
