<script setup lang="ts">
import { ref, computed } from "vue";
import { Box, Text, useBoxMetrics } from "@vue-tui/runtime";
import { sparkline } from "../lib/sparkline";
import { theme } from "../theme";

const props = withDefaults(
  defineProps<{ values: number[]; max?: number; color?: string }>(),
  { color: theme.cpu },
);

// Measure our own width so the graph always fills the panel, however the flex
// layout sized it. Falls back to 24 cells until the first layout pass lands.
const box = ref();
const bm = useBoxMetrics(box);
const line = computed(() => sparkline(props.values, Math.max(1, bm.width.value || 24), props.max));
</script>

<template>
  <Box ref="box" width="100%">
    <Text :color="color" wrap="truncate">{{ line }}</Text>
  </Box>
</template>
