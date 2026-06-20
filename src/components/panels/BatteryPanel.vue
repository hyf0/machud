<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import { theme } from "../../theme";
import { pct } from "../../lib/format";
import type { BatteryMetric } from "../../types";

defineProps<{ battery: BatteryMetric }>();
</script>

<template>
  <Panel title=" BATTERY" :accent="theme.battery" :minWidth="24">
    <template #header-right>
      <Text :color="theme.dim">{{ battery.charging ? "⚡ charging" : battery.state }}</Text>
    </template>

    <Box justifyContent="space-between">
      <Text :color="theme.battery" bold>{{ pct(battery.pct) }}</Text>
      <Text :color="theme.dim">{{ battery.timeRemaining ?? (battery.charging ? "—" : "on AC") }}</Text>
    </Box>

    <Box>
      <Bar :value="battery.pct" :width="16" :color="theme.battery" />
    </Box>

    <Box>
      <Text :color="theme.dim">health </Text>
      <Text :color="theme.text">{{ pct(battery.healthPct) }}</Text>
      <Text :color="theme.dim">  cycles </Text>
      <Text :color="theme.text">{{ battery.cycleCount ?? "—" }}</Text>
    </Box>
  </Panel>
</template>
