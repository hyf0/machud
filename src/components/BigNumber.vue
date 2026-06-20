<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import { bigDigits } from "../lib/bignum";
import { ramp, supportsTruecolor } from "../lib/color";
import { theme } from "../theme";

const props = withDefaults(defineProps<{ value: number; suffix?: string; color?: string }>(), {
  suffix: "",
  color: theme.cpu,
});

// The hero is a glanceable whole number, not a precise float.
const rows = computed(() => bigDigits(String(Math.round(props.value))));

// Gentle same-hue 2-tone gradient, top brightest (DESIGN.md BigNumber: "module accent, gentle
// 2-tone same-hue gradient"). Degrade to a solid accent below truecolor (D11) — same gate the
// meters/graph use, so the whole panel makes the truecolor↔256 decision identically.
const rowColors = computed(() =>
  supportsTruecolor()
    ? ramp(props.color, rows.value.length).slice().reverse()
    : Array(rows.value.length).fill(props.color),
);
</script>

<template>
  <Box flexDirection="column">
    <Box v-for="(row, i) in rows" :key="i">
      <Text :color="rowColors[i]">{{ row }}</Text>
      <Text v-if="suffix && i === rows.length - 1" :color="theme.dim"> {{ suffix }}</Text>
    </Box>
  </Box>
</template>
