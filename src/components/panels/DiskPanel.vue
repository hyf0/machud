<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import { theme } from "../../theme";
import { pct, humanBytes } from "../../lib/format";
import type { DiskMetric } from "../../types";

const props = defineProps<{ disk: DiskMetric }>();

// Disk is low-value real estate, so it stays calm (its module hue) until near-full, when an
// EARNED signal escalates: amber ≥85% "NEAR FULL", red ≥95% "FULL" (colour + text, non-hue safe).
// Hue confinement (D9): the bar body stays the shared green accent when roomy, escalating to an
// EARNED warn/bad only near-full — the disk module hue lives on the title/border/number, not the bar.
const diskColor = computed(() =>
  props.disk.usedPct >= 95 ? theme.bad : props.disk.usedPct >= 85 ? theme.warn : theme.accent,
);
const diskState = computed(() =>
  props.disk.usedPct >= 95 ? "FULL" : props.disk.usedPct >= 85 ? "NEAR FULL" : "",
);
</script>

<template>
  <Panel title=" DISK" :accent="theme.disk" :minWidth="22">
    <template #header-right>
      <Text :color="theme.dim">{{ disk.mount }}</Text>
    </template>

    <Box justifyContent="space-between">
      <Text :color="theme.disk" bold>{{ pct(disk.usedPct) }}</Text>
      <Text :color="diskState ? diskColor : theme.dim">{{
        diskState || `${humanBytes(disk.free)} free`
      }}</Text>
    </Box>

    <Box>
      <Bar :value="disk.usedPct" :width="16" :color="diskColor" />
    </Box>

    <Box>
      <Text :color="theme.dim">R </Text>
      <Text :color="theme.net">{{ humanBytes(disk.readBps, true) }}</Text>
      <Text :color="theme.dim">  W </Text>
      <Text :color="theme.warn">{{ humanBytes(disk.writeBps, true) }}</Text>
    </Box>
    <Box>
      <Text :color="theme.dim">{{ humanBytes(disk.used) }} / {{ humanBytes(disk.total) }}</Text>
    </Box>
  </Panel>
</template>
