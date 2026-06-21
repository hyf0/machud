import { execFileSync } from "node:child_process";
import { sh } from "../exec";
import type { AppearanceMetric, AppearanceMode } from "../../types";

const TEST_APPEARANCE = "MACHUD_TEST_APPEARANCE";

let cached: AppearanceMetric | null = null;
let cachedAt = 0;

// Follow macOS appearance without adding a user-facing theme setting. On macOS,
// AppleInterfaceStyle is "Dark" in dark mode and absent in light mode.
export async function collectAppearance(): Promise<AppearanceMetric> {
  const testMode = process.env[TEST_APPEARANCE];
  if (testMode === "dark" || testMode === "light") {
    return { mode: testMode };
  }

  const now = Date.now();
  if (cached && now - cachedAt < 5000) return cached;

  const out = await sh("defaults", ["read", "-g", "AppleInterfaceStyle"], 1000);
  cached = { mode: /dark/i.test(out) ? "dark" : "light" };
  cachedAt = now;
  return cached;
}

// Synchronous sibling of collectAppearance, for the FIRST paint only: the async poll
// lands ~100 ms after mount — too late to set the initial theme, so a dark-mode Mac
// would flash the light palette. App.vue seeds its initial appearance with this.
// Honors the same test hook; falls back to light (in light mode the key is absent and
// `defaults` exits non-zero, which is itself the correct light signal).
export function detectAppearanceSync(): AppearanceMode {
  const testMode = process.env[TEST_APPEARANCE];
  if (testMode === "dark" || testMode === "light") return testMode;
  try {
    const out = execFileSync("defaults", ["read", "-g", "AppleInterfaceStyle"], {
      timeout: 1000,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    return /dark/i.test(out) ? "dark" : "light";
  } catch {
    return "light";
  }
}
