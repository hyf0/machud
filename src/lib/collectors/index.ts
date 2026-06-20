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
  return { cpu, memory, gpu, disk, net, battery, sensors, appearance, ts: Date.now() };
}
