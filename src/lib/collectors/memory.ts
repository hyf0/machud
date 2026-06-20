import os from "node:os";
import { sh } from "../exec";
import { clamp } from "../format";
import type { MemoryMetric, NamedUsage } from "../../types";

function parseSwap(s: string, key: string): number {
  const m = s.match(new RegExp(`${key}\\s*=\\s*([\\d.]+)([MGK])`));
  if (!m) return 0;
  const v = parseFloat(m[1]);
  const unit = m[2];
  const mult = unit === "G" ? 2 ** 30 : unit === "K" ? 2 ** 10 : 2 ** 20;
  return v * mult;
}

export async function collectMemory(): Promise<MemoryMetric> {
  const total = os.totalmem();

  const vm = await sh("vm_stat");
  const pageSize = Number(vm.match(/page size of (\d+) bytes/)?.[1] ?? 16384);
  const pages = (name: string): number => {
    const m = vm.match(new RegExp(`${name}:\\s+(\\d+)\\.`));
    return m ? Number(m[1]) * pageSize : 0;
  };
  const free = pages("Pages free") + pages("Pages speculative");
  const wired = pages("Pages wired down");
  const compressed = pages("Pages occupied by compressor");
  const active = pages("Pages active");
  // "Used" the way Activity Monitor / htop count it: wired + compressed + app
  // (anonymous) memory, excluding reclaimable file cache (inactive/purgeable).
  const used = clamp(wired + compressed + active, 0, total);
  const app = clamp(active, 0, total);
  const usedPct = total > 0 ? clamp((used / total) * 100) : 0;

  const swap = await sh("sysctl", ["-n", "vm.swapusage"]);
  const swapTotal = parseSwap(swap, "total");
  const swapUsed = parseSwap(swap, "used");

  const pressure: MemoryMetric["pressure"] =
    usedPct >= 88 || swapUsed > 2 ** 30 ? "High" : usedPct >= 72 ? "Elevated" : "Normal";

  // Top memory consumers: ps sorted by resident size (-m), rss is in KiB.
  const ps = await sh("ps", ["-A", "-o", "rss=,comm=", "-m"]);
  const topApps: NamedUsage[] = ps
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((l) => {
      const sp = l.indexOf(" ");
      const rss = Number(l.slice(0, sp));
      const comm = l.slice(sp + 1).trim();
      const name = comm.split("/").pop() || comm;
      return { name, bytes: (isFinite(rss) ? rss : 0) * 1024 };
    });

  return {
    total,
    used,
    free,
    wired,
    compressed,
    app,
    usedPct,
    pressure,
    swapTotal,
    swapUsed,
    topApps,
  };
}
