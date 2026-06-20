<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import { theme } from "../../theme";
import { pct } from "../../lib/format";
import type { Metrics } from "../../types";

const props = defineProps<{ m: Metrics; now: number }>();

const clock = computed(() => {
  const d = new Date(props.now || Date.now());
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
});
</script>

<template>
  <Box :paddingX="1" justifyContent="space-between">
    <Box>
      <Text :color="theme.silver" bold>mac</Text><Text :color="theme.accent" bold>hud</Text>
      <Text :color="theme.dim"> · macOS system monitor</Text>
    </Box>
    <Box>
      <Text :color="theme.cpu">CPU {{ pct(m.cpu.usage) }}</Text>
      <Text :color="theme.dim"> · </Text>
      <Text :color="theme.mem">MEM {{ pct(m.memory.usedPct) }}</Text>
      <Text :color="theme.dim"> · </Text>
      <Text :color="theme.gpu">GPU {{ pct(m.gpu.usage) }}</Text>
      <Text :color="theme.dim"> · </Text>
      <Text :color="theme.battery">BAT {{ pct(m.battery.pct) }}{{ m.battery.charging ? " ⇡" : "" }}</Text>
      <Text :color="theme.dim"> · </Text>
      <Text :color="theme.title" bold>{{ clock }}</Text>
    </Box>
  </Box>
</template>
