import { sh } from "../exec";
import type { AppearanceMetric } from "../../types";

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
