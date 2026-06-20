<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import BigNumber from "../BigNumber.vue";
import Graph from "../Graph.vue";
import { theme } from "../../theme";
import { humanBytes } from "../../lib/format";
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
      <BigNumber :value="memory.usedPct" suffix="%" :color="theme.mem" />
      <Text :color="pressureColor(memory.pressure)">{{ memory.pressure }}</Text>
    </Box>

    <Graph :values="history" :max="100" :height="4" :color="theme.mem" />

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
