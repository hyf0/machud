import { reactive } from "vue";
import type { AppearanceMode } from "./types";

// Everforest — a muted, low-strain, green-forward palette (D9, [VOUCHED]). DESIGN.md is the
// source of truth for these hex; verify.mjs pins them so theme and doc can't silently desync.
// machud follows the macOS system appearance (D8); dark is the hero, light a faithful daylight mode.
type ThemePalette = {
  bg: string;
  bgLift: string;
  frame: string;
  title: string;
  text: string;
  dim: string;
  accent: string; // primary brand green
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

const palettes: Record<AppearanceMode, ThemePalette> = {
  dark: {
    bg: "#2d353b",
    bgLift: "#343f44",
    frame: "#4f5b58",
    title: "#d3c6aa",
    text: "#9da9a0",
    dim: "#5c6a64",
    accent: "#a7c080",

    cpu: "#a7c080",
    mem: "#d699b6",
    gpu: "#7fbbb3",
    disk: "#dbbc7f",
    net: "#83c092",
    battery: "#e69875",
    sensor: "#e67e80",

    good: "#a7c080",
    warn: "#dbbc7f",
    bad: "#e67e80",
  },
  light: {
    bg: "#fdf6e3",
    bgLift: "#f4f0d9",
    frame: "#ddd8be",
    title: "#5c6a72",
    text: "#5c6a72",
    dim: "#939f91",
    accent: "#8da101",

    cpu: "#8da101",
    mem: "#df69ba",
    gpu: "#3a94c5",
    disk: "#dfa000",
    net: "#35a77c",
    battery: "#f57d26",
    sensor: "#f85552",

    good: "#8da101",
    warn: "#dfa000",
    bad: "#f85552",
  },
};

export const theme = reactive({ ...palettes.light });

export function setThemeMode(mode: AppearanceMode): void {
  Object.assign(theme, palettes[mode]);
}

// Green → amber → red as a percentage climbs. Used for load bars.
export function levelColor(pct: number): string {
  if (pct >= 85) return theme.bad;
  if (pct >= 60) return theme.warn;
  return theme.good;
}
