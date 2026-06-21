<script setup lang="ts">
import { computed } from "vue";
import { Box, Text } from "@vue-tui/runtime";
import Panel from "../Panel.vue";
import Bar from "../Bar.vue";
import { theme } from "../../theme";
import { temp } from "../../lib/format";
import type { SensorsMetric } from "../../types";

const props = defineProps<{ sensors: SensorsMetric }>();

const pressureColor = computed(() =>
  props.sensors.thermalPressure === "Nominal"
    ? theme.good
    : props.sensors.thermalPressure === "Fair"
      ? theme.warn
      : theme.bad,
);
</script>

<template>
  <Panel title=" SENSORS" :accent="theme.sensor" :flexGrow="2" :minWidth="24">
    <Box justifyContent="space-between">
      <Text :color="theme.dim">thermal</Text>
      <Text :color="pressureColor" bold>{{ sensors.thermalPressure }}</Text>
    </Box>

    <Box>
      <Text :color="theme.dim">cpu cap </Text>
      <Bar :value="sensors.speedLimit" :width="12" :color="theme.sensor" />
    </Box>

    <Box justifyContent="space-between">
      <Text :color="theme.dim">battery temp</Text>
      <Text :color="theme.text">{{ temp(sensors.batteryTempC) }}</Text>
    </Box>
    <Box justifyContent="space-between">
      <Text :color="theme.dim">fan</Text>
      <Text :color="theme.dim">{{ sensors.fanRpm ?? "— sudo" }}</Text>
    </Box>
  </Panel>
</template>
