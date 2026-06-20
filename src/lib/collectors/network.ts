import os from "node:os";
import { sh } from "../exec";
import type { NetMetric } from "../../types";

let prev: { rx: number; tx: number; t: number } | null = null;

export async function collectNet(): Promise<NetMetric> {
  const iface =
    (await sh("route", ["-n", "get", "default"])).match(/interface:\s*(\S+)/)?.[1] || "en0";

  // The hardware row (the one carrying the <Link#…> token) holds cumulative
  // byte counters: Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes.
  const ns = await sh("netstat", ["-ibn"]);
  let rx = 0;
  let tx = 0;
  for (const l of ns.split("\n")) {
    if (l.startsWith(`${iface} `) && l.includes("<Link#")) {
      const p = l.trim().split(/\s+/);
      rx = Number(p[6]) || 0;
      tx = Number(p[9]) || 0;
      break;
    }
  }

  const now = Date.now();
  let rxBps = 0;
  let txBps = 0;
  if (prev && prev.rx <= rx && prev.tx <= tx) {
    const dt = (now - prev.t) / 1000;
    if (dt > 0) {
      rxBps = (rx - prev.rx) / dt;
      txBps = (tx - prev.tx) / dt;
    }
  }
  prev = { rx, tx, t: now };

  const ip = os.networkInterfaces()[iface]?.find((a) => a.family === "IPv4")?.address ?? null;
  return { iface, ip, rxBps, txBps, rxTotal: rx, txTotal: tx };
}
