<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import { theme } from "../theme";

withDefaults(
  defineProps<{
    title: string;
    accent?: string;
    flexGrow?: number;
    minWidth?: number;
    width?: number | string;
  }>(),
  { accent: theme.frame, flexGrow: 1 },
);
</script>

<template>
  <Box
    flexDirection="column"
    :flexGrow="flexGrow"
    :minWidth="minWidth"
    :width="width"
    borderStyle="round"
    :borderColor="accent"
    :paddingX="1"
  >
    <Box justifyContent="space-between">
      <Text :color="accent" bold>{{ title }}</Text>
      <slot name="header-right" />
    </Box>
    <slot />
  </Box>
</template>
