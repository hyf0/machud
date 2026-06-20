<script setup lang="ts">
import { computed } from "vue";
import { Text } from "@vue-tui/runtime";
import { theme, levelColor } from "../theme";
import { barCells } from "../lib/sparkline";
import { ramp, supportsTruecolor } from "../lib/color";

const props = withDefaults(
  defineProps<{ value: number; max?: number; width?: number; color?: string }>(),
  { max: 100, width: 12 },
);

const cells = computed(() => barCells(props.value, props.max, props.width));
const col = computed(
  () => props.color ?? levelColor(props.max > 0 ? (props.value / props.max) * 100 : 0),
);

// Gradient meter (truecolor only, D11): a same-hue dim→accent ramp across the filled cells.
// Below truecolor (e.g. Terminal.app 256-colour) we degrade to the solid accent — no banding.
const fillChars = computed(() => [...cells.value.fill]);
const gradient = computed(() => supportsTruecolor() && fillChars.value.length > 1);
const fillColors = computed(() => ramp(col.value, fillChars.value.length));
</script>

<template
  ><template v-if="gradient"
    ><Text v-for="(c, i) in fillChars" :key="i" :color="fillColors[i]">{{ c }}</Text></template
  ><Text v-else :color="col">{{ cells.fill }}</Text
  ><Text :color="theme.frame">{{ cells.rest }}</Text></template
>
