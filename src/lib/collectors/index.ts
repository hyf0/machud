import type { Metrics } from "../../types";
import { emptyMetrics } from "../empty";
import { collectCpu } from "./cpu";
import { collectMemory } from "./memory";
import { collectGpu } from "./gpu";
import { collectDisk } from "./disk";
import { collectNet } from "./network";
import { collectBattery } from "./battery";
import { collectSensors } from "./sensors";
import { collectAppearance } from "./appearance";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

// Gather every module in parallel. A collector that throws is swallowed and
// replaced by its empty default, so one failing source never blanks the others.
export async function collectAll(): Promise<Metrics> {
  const e = emptyMetrics();
  const [cpu, memory, gpu, disk, net, battery, sensors, appearance] = await Promise.all([
    safe(collectCpu(), e.cpu),
    safe(collectMemory(), e.memory),
    safe(collectGpu(), e.gpu),
    safe(collectDisk(), e.disk),
    safe(collectNet(), e.net),
    safe(collectBattery(), e.battery),
    safe(collectSensors(), e.sensors),
    safe(collectAppearance(), e.appearance),
  ]);
  const snapshot: Metrics = { cpu, memory, gpu, disk, net, battery, sensors, appearance, ts: Date.now() };
  return applyTestOverride(snapshot);
}

// Test-only injection hook (sibling of MACHUD_TEST_APPEARANCE): MACHUD_TEST_OVERRIDE is a
// JSON object deep-merged into the snapshot, letting the verify gate exercise states this
// host can't produce (on-battery watts, high memory pressure, Intel single-cluster,
// near-full disk). Never set in the product path, so real use is unaffected.
function applyTestOverride(m: Metrics): Metrics {
  const raw = process.env.MACHUD_TEST_OVERRIDE;
  if (!raw) return m;
  try {
    return deepMerge(m, JSON.parse(raw));
  } catch {
    return m;
  }
}

function deepMerge<T>(base: T, over: unknown): T {
  if (over === null || typeof over !== "object" || Array.isArray(over)) return over as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = deepMerge((base as Record<string, unknown> | undefined)?.[k], v);
  }
  return out as T;
}
