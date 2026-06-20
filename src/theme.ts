import { reactive } from "vue";
import type { AppearanceMode } from "./types";

type ThemePalette = {
  bg: string;
  frame: string;
  title: string;
  text: string;
  dim: string;
  cpu: string;
  mem: string;
  gpu: string;
  disk: string;
  net: string;
  battery: string;
  sensor: string;
  good: string;
  warn: string;
  bad: string;
};

// machud follows macOS appearance automatically, without adding a user-facing
// theme setting. Per-module accent colors keep each panel recognizable in both
// terminal background modes.
const palettes: Record<AppearanceMode, ThemePalette> = {
  dark: {
    bg: "#1a1b26",
    frame: "#3b4261",
    title: "#c0caf5",
    text: "#a9b1d6",
    dim: "#565f89",

    cpu: "#7aa2f7",
    mem: "#bb9af7",
    gpu: "#7dcfff",
    disk: "#e0af68",
    net: "#9ece6a",
    battery: "#73daca",
    sensor: "#f7768e",

    good: "#9ece6a",
    warn: "#e0af68",
    bad: "#f7768e",
  },
  light: {
    bg: "#f7f8fc",
    frame: "#b8c0d6",
    title: "#1f2335",
    text: "#343b58",
    dim: "#6b7286",

    cpu: "#2f63c6",
    mem: "#8a4fb3",
    gpu: "#0077a8",
    disk: "#9a5b00",
    net: "#2f7d32",
    battery: "#00796b",
    sensor: "#bd3f57",

    good: "#2f7d32",
    warn: "#9a5b00",
    bad: "#bd3f57",
  },
};

export const theme = reactive({ ...palettes.light });

export function setThemeMode(mode: AppearanceMode): void {
  Object.assign(theme, palettes[mode]);
}

// Green → yellow → red as a percentage climbs. Used for load bars.
export function levelColor(pct: number): string {
  if (pct >= 85) return theme.bad;
  if (pct >= 60) return theme.warn;
  return theme.good;
}
