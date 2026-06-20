import { sh } from "../exec";
import { clamp } from "../format";
import type { DiskMetric } from "../../types";

let prev: { read: number; write: number; t: number } | null = null;

export async function collectDisk(): Promise<DiskMetric> {
  // Root-volume capacity (-P keeps each entry on one line).
  const df = await sh("df", ["-k", "-P", "/"]);
  const f = (df.trim().split("\n").pop() ?? "").split(/\s+/);
  const total = (Number(f[1]) || 0) * 1024;
  const used = (Number(f[2]) || 0) * 1024;
  const free = (Number(f[3]) || 0) * 1024;
  const usedPct = total > 0 ? clamp((used / total) * 100) : 0;

  // Cumulative bytes since boot from every block-storage driver; diff for a rate.
  const io = await sh("ioreg", ["-r", "-c", "IOBlockStorageDriver", "-w", "0"]);
  const sum = (key: string): number =>
    [...io.matchAll(new RegExp(`"${key}"=(\\d+)`, "g"))].reduce((s, m) => s + Number(m[1]), 0);
  const read = sum("Bytes \\(Read\\)");
  const write = sum("Bytes \\(Write\\)");

  const now = Date.now();
  let readBps = 0;
  let writeBps = 0;
  if (prev) {
    const dt = (now - prev.t) / 1000;
    if (dt > 0) {
      readBps = Math.max(0, (read - prev.read) / dt);
      writeBps = Math.max(0, (write - prev.write) / dt);
    }
  }
  prev = { read, write, t: now };

  return { total, used, free, usedPct, readBps, writeBps, mount: f[5] || "/" };
}
