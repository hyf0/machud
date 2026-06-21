<script setup lang="ts">
import { Box, Text } from "@vue-tui/runtime";
import { theme } from "../theme";

withDefaults(
  defineProps<{
    title: string;
    accent?: string;
    flexGrow?: number;
    flexBasis?: number;
    minWidth?: number;
    width?: number | string;
  }>(),
  // flexBasis 0: a content-heavy panel (e.g. DISK) won't bloat its column past its flexGrow share,
  // so the vertical seams between panels stay where the ratios put them (and align across rows).
  { accent: theme.frame, flexGrow: 1, flexBasis: 0 },
);
</script>

<template>
  <Box
    flexDirection="column"
    :flexGrow="flexGrow"
    :flexBasis="flexBasis"
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
