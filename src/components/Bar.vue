<script setup lang="ts">
import { computed } from "vue";
import { Text } from "@vue-tui/runtime";
import { theme, levelColor } from "../theme";
import { barCells } from "../lib/sparkline";

const props = withDefaults(
  defineProps<{ value: number; max?: number; width?: number; color?: string }>(),
  { max: 100, width: 12 },
);

const cells = computed(() => barCells(props.value, props.max, props.width));
const col = computed(
  () => props.color ?? levelColor(props.max > 0 ? (props.value / props.max) * 100 : 0),
);
</script>

<template>
  <Text :color="col">{{ cells.fill }}</Text><Text :color="theme.frame">{{ cells.rest }}</Text>
</template>
