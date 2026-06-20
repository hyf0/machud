<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import Sparkline from "../Sparkline.vue";
import { theme } from "../../theme";
import { pct, humanBytes } from "../../lib/format";
import type { MemoryMetric } from "../../types";

defineProps<{ memory: MemoryMetric; history: number[] }>();

const pressureColor = (p: MemoryMetric["pressure"]) =>
  p === "High" ? theme.bad : p === "Elevated" ? theme.warn : theme.good;
</script>

<template>
  <Panel title=" MEMORY" :accent="theme.mem" :flexGrow="2" :minWidth="28">
    <template #header-right>
      <Text :color="theme.dim">{{ humanBytes(memory.used) }} / {{ humanBytes(memory.total) }}</Text>
    </template>

    <Box justifyContent="space-between">
      <Text :color="theme.mem" bold>{{ pct(memory.usedPct) }}</Text>
      <Text :color="pressureColor(memory.pressure)">{{ memory.pressure }}</Text>
    </Box>

    <Sparkline :values="history" :max="100" :color="theme.mem" />

    <Box>
      <Text :color="theme.dim">used </Text>
      <Bar :value="memory.usedPct" :width="14" :color="theme.mem" />
    </Box>
    <Box>
      <Text :color="theme.dim">wired {{ humanBytes(memory.wired) }} · swap {{ humanBytes(memory.swapUsed) }}</Text>
    </Box>

    <Box v-for="app in memory.topApps.slice(0, 3)" :key="app.name" justifyContent="space-between">
      <Text :color="theme.text" wrap="truncate">{{ app.name }}</Text>
      <Text :color="theme.dim">{{ humanBytes(app.bytes) }}</Text>
    </Box>
  </Panel>
</template>
