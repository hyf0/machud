<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import Sparkline from "../Sparkline.vue";
import { theme } from "../../theme";
import { pct, humanBytes } from "../../lib/format";
import type { GpuMetric } from "../../types";

defineProps<{ gpu: GpuMetric; history: number[] }>();
</script>

<template>
  <Panel title=" GPU" :accent="theme.gpu" :minWidth="22">
    <Box justifyContent="space-between">
      <Text :color="theme.gpu" bold>{{ pct(gpu.usage) }}</Text>
      <Text :color="theme.dim">render {{ pct(gpu.renderer) }}</Text>
    </Box>

    <Sparkline :values="history" :max="100" :color="theme.gpu" />

    <Box>
      <Bar :value="gpu.usage ?? 0" :width="14" :color="theme.gpu" />
    </Box>
    <Box>
      <Text :color="theme.dim">vram {{ humanBytes(gpu.vram) }}</Text>
    </Box>
  </Panel>
</template>
