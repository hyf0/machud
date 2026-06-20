import os from "node:os";
import { sh } from "../exec";
import { clamp } from "../format";
import type { CpuCore, CpuMetric } from "../../types";

// Per-core usage is computed from deltas between successive os.cpus() snapshots,
// so the first sample reads as 0% and subsequent samples reflect the interval.
// This avoids any blocking sleep and needs no privileges.
let prev: os.CpuInfo["times"][] | null = null;
let counts: { p: number; e: number } | null = null;
let model = "";

async function clusterCounts(): Promise<{ p: number; e: number }> {
  if (counts) return counts;
  const out = await sh("sysctl", ["-n", "hw.perflevel0.logicalcpu", "hw.perflevel1.logicalcpu"]);
  const nums = out.trim().split(/\s+/).map(Number);
  // perflevel0 = performance cores, perflevel1 = efficiency cores.
  counts = { p: nums[0] || 0, e: nums[1] || 0 };
  return counts;
}

export async function collectCpu(): Promise<CpuMetric> {
  if (!model) model = (await sh("sysctl", ["-n", "machdep.cpu.brand_string"])).trim() || "CPU";
  const { p: pCount, e: eCount } = await clusterCounts();

  const times = os.cpus().map((c) => c.times);
  const cores: CpuCore[] = times.map((t, i) => {
    let usage = 0;
    const p = prev?.[i];
    if (p) {
      const idle = t.idle - p.idle;
      const total =
        t.user - p.user + (t.nice - p.nice) + (t.sys - p.sys) + (t.irq - p.irq) + idle;
      usage = total > 0 ? clamp((1 - idle / total) * 100) : 0;
    }
    // On Apple Silicon logical CPUs are numbered efficiency-cores first, then
    // performance-cores, so the first `eCount` indices are the E-cluster.
    const cluster: "P" | "E" = i < eCount ? "E" : "P";
    return { usage, cluster };
  });
  prev = times;

  const avg = (xs: CpuCore[]) =>
    xs.length ? xs.reduce((s, c) => s + c.usage, 0) / xs.length : 0;
  const eCores = cores.filter((c) => c.cluster === "E");
  const pCores = cores.filter((c) => c.cluster === "P");

  return {
    model,
    usage: avg(cores),
    cores,
    pUsage: avg(pCores),
    eUsage: avg(eCores),
    pCount,
    eCount,
    loadAvg: os.loadavg() as [number, number, number],
    freqMHz: null,
  };
}
