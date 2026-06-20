<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import { theme } from "../../theme";
import { pct } from "../../lib/format";
import type { BatteryMetric } from "../../types";

const props = defineProps<{ battery: BatteryMetric }>();

// Real-time charge power (+ in / − out) + the live-detected adapter max wattage (Mac-exclusive).
const watts = computed(() => {
  const b = props.battery;
  const parts: string[] = [];
  if (b.chargeWatts != null && Math.abs(b.chargeWatts) >= 0.1) {
    parts.push(`${b.chargeWatts >= 0 ? "+" : "−"}${Math.abs(b.chargeWatts).toFixed(1)}W`);
  }
  if (b.adapterWatts != null) parts.push(`${b.adapterWatts}W adapter`);
  return parts.join(" · ");
});
</script>

<template>
  <Panel title=" BATTERY" :accent="theme.battery" :minWidth="24">
    <template #header-right>
      <Text :color="theme.dim">{{ battery.charging ? "⇡ charging" : battery.state }}</Text>
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

    <Box>
      <Text :color="theme.dim">power </Text>
      <Text :color="theme.text">{{ watts || (battery.present ? "on AC" : "—") }}</Text>
    </Box>
  </Panel>
</template>
