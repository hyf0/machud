<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import Graph from "../Graph.vue";
import BigNumber from "../BigNumber.vue";
import { theme } from "../../theme";
import { pct } from "../../lib/format";
import type { CpuMetric } from "../../types";

const props = defineProps<{ cpu: CpuMetric; history: number[] }>();

const LEVELS = "▁▂▃▄▅▆▇█";
const coreStr = (usages: number[]) =>
  usages
    .map((u) => LEVELS[Math.min(7, Math.max(0, Math.round((u / 100) * 7)))])
    .join("");

const eStr = computed(() =>
  coreStr(props.cpu.cores.filter((c) => c.cluster === "E").map((c) => c.usage)),
);
const pStr = computed(() =>
  coreStr(props.cpu.cores.filter((c) => c.cluster === "P").map((c) => c.usage)),
);
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

    <Box>
      <Text :color="theme.dim">cores </Text>
      <Text :color="theme.battery">{{ eStr }}</Text>
      <Text :color="theme.frame">┊</Text>
      <Text :color="theme.cpu">{{ pStr }}</Text>
      <Text :color="theme.dim"> {{ cpu.eCount }}E+{{ cpu.pCount }}P</Text>
    </Box>
  </Panel>
</template>
