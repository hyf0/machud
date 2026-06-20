<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import Graph from "../Graph.vue";
import BigNumber from "../BigNumber.vue";
import CoreGrid from "../CoreGrid.vue";
import { theme } from "../../theme";
import { pct } from "../../lib/format";
import type { CpuMetric } from "../../types";

defineProps<{ cpu: CpuMetric; history: number[] }>();
</script>

<template>
  <Panel title=" CPU" :accent="theme.cpu" :flexGrow="3" :minWidth="32">
    <template #header-right>
      <Text :color="theme.dim" wrap="truncate">{{ cpu.model }}</Text>
    </template>

    <Box justifyContent="space-between">
      <BigNumber :value="cpu.usage" suffix="%" :color="theme.cpu" />
      <Text :color="theme.dim">load {{ cpu.loadAvg[0].toFixed(2) }}</Text>
    </Box>

    <Graph :values="history" :max="100" :height="4" :color="theme.cpu" />

    <Box>
      <Text :color="theme.dim">P </Text>
      <Bar :value="cpu.pUsage" :width="12" />
      <Text :color="theme.text"> {{ pct(cpu.pUsage) }}</Text>
    </Box>
    <Box>
      <Text :color="theme.dim">E </Text>
      <Bar :value="cpu.eUsage" :width="12" />
      <Text :color="theme.text"> {{ pct(cpu.eUsage) }}</Text>
    </Box>

    <CoreGrid :cores="cpu.cores" />

    <Box v-for="p in cpu.topProcs.slice(0, 3)" :key="p.name" justifyContent="space-between">
      <Text :color="theme.text" wrap="truncate">{{ p.name }}</Text>
      <Text :color="theme.dim">{{ p.pct.toFixed(0) }}%</Text>
    </Box>
  </Panel>
</template>
