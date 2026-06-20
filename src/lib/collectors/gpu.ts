import { sh } from "../exec";
import type { GpuMetric } from "../../types";

// Apple's GPU exposes live counters in the IOAccelerator service's
// PerformanceStatistics dict — readable without privileges via ioreg. Keys look
// like `"Device Utilization %"=44` (no spaces around the =).
export async function collectGpu(): Promise<GpuMetric> {
  const out = await sh("ioreg", ["-r", "-d", "1", "-w", "0", "-c", "IOAccelerator"]);
  const num = (key: string): number | null => {
    const m = out.match(new RegExp(`"${key}"=([0-9]+)`));
    return m ? Number(m[1]) : null;
  };
  return {
    usage: num("Device Utilization %"),
    renderer: num("Renderer Utilization %"),
    vram: num("In use system memory"),
  };
}
