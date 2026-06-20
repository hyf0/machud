<script setup lang="ts">
import { ref, computed } from "vue";
import { Box, Text, useBoxMetrics } from "@vue-tui/runtime";
import { brailleArea } from "../lib/sparkline";
import { ramp, supportsTruecolor } from "../lib/color";
import { theme } from "../theme";

const props = withDefaults(
  defineProps<{ values: number[]; height?: number; max?: number; color?: string }>(),
  { height: 3, color: theme.cpu },
);

// Measure our own width so the graph always fills the panel, however flex sized it.
const box = ref();
const bm = useBoxMetrics(box);
const rows = computed(() =>
  brailleArea(props.values, Math.max(1, bm.width.value || 24), props.height, props.max),
);

// Vertical gradient: top row brightest (the moving line), bottom dimmest (the filled base).
// Solid accent below truecolor (D11).
const rowColors = computed(() =>
  supportsTruecolor() ? ramp(props.color, props.height).slice().reverse() : Array(props.height).fill(props.color),
);
</script>

<template>
  <Box ref="box" flexDirection="column" width="100%">
    <Text v-for="(row, i) in rows" :key="i" :color="rowColors[i]" wrap="truncate">{{ row }}</Text>
  </Box>
</template>
