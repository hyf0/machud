<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Sparkline from "../Sparkline.vue";
import { theme } from "../../theme";
import { humanBytes } from "../../lib/format";
import type { NetMetric } from "../../types";

defineProps<{ net: NetMetric; rx: number[]; tx: number[] }>();
</script>

<template>
  <Panel title=" NETWORK" :accent="theme.net" :flexGrow="2" :minWidth="26">
    <template #header-right>
      <Text :color="theme.dim">{{ net.iface }}</Text>
    </template>

    <Box>
      <Text :color="theme.net" bold>▼ {{ humanBytes(net.rxBps, true) }}</Text>
    </Box>
    <Sparkline :values="rx" :color="theme.net" />

    <Box>
      <Text :color="theme.gpu" bold>▲ {{ humanBytes(net.txBps, true) }}</Text>
    </Box>
    <Sparkline :values="tx" :color="theme.gpu" />

    <Box>
      <Text :color="theme.dim">{{ net.ip ?? "no address" }}</Text>
    </Box>
  </Panel>
</template>
