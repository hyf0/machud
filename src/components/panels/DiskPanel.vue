<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import { theme } from "../../theme";
import { pct, humanBytes } from "../../lib/format";
import type { DiskMetric } from "../../types";

defineProps<{ disk: DiskMetric }>();
</script>

<template>
  <Panel title=" DISK" :accent="theme.disk" :minWidth="22">
    <template #header-right>
      <Text :color="theme.dim">{{ disk.mount }}</Text>
    </template>

    <Box justifyContent="space-between">
      <Text :color="theme.disk" bold>{{ pct(disk.usedPct) }}</Text>
      <Text :color="theme.dim">{{ humanBytes(disk.free) }} free</Text>
    </Box>

    <Box>
      <Bar :value="disk.usedPct" :width="16" :color="theme.disk" />
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
