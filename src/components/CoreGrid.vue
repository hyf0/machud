<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import { theme, levelColor } from "../theme";
import type { CpuCore } from "../types";

const props = defineProps<{ cores: CpuCore[] }>();

// Small multiples: one mini-bar per core, height ∝ load, COLOURED BY LOAD (levelColor) — so a hot
// core reads at a glance, not just "which cluster" (DESIGN Principle 5 + the per-core grid spec).
const LEVELS = "▁▂▃▄▅▆▇█";
const glyph = (u: number) => LEVELS[Math.min(7, Math.max(0, Math.round((u / 100) * 7)))];

// Apple Silicon: E and P as separate labelled groups. Single cluster (Intel — one cluster, the other
// empty): one unlabelled row, never an empty "E" group (DESIGN: "never 0P+0E or all-P").
const groups = computed(() => {
  const e = props.cores.filter((c) => c.cluster === "E");
  const p = props.cores.filter((c) => c.cluster === "P");
  if (e.length === 0 || p.length === 0) return [{ label: "", cores: props.cores }];
  return [
    { label: "E", cores: e },
    { label: "P", cores: p },
  ];
});
</script>

<template>
  <Box v-for="(g, gi) in groups" :key="gi">
    <Text v-if="g.label" :color="theme.dim">{{ g.label }} </Text>
    <Text v-for="(c, ci) in g.cores" :key="ci" :color="levelColor(c.usage)">{{ glyph(c.usage) }}</Text>
  </Box>
</template>
