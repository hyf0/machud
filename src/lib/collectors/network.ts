import { sh } from "../exec";
import type { NetMetric } from "../../types";

let prev: { iface: string; rx: number; tx: number; t: number } | null = null;

export async function collectNet(): Promise<NetMetric> {
  // MACHUD_TEST_NET_IFACE / MACHUD_TEST_NETSTAT (see verify.mjs) let the gate feed a
  // controlled interface + raw `netstat -ibn`, so the parser can be exercised on the
  // address-less (VPN/utun) rows this host may not route through.
  const iface =
    process.env.MACHUD_TEST_NET_IFACE ||
    (await sh("route", ["-n", "get", "default"])).match(/interface:\s*(\S+)/)?.[1] ||
    "en0";

  // The hardware row (the one carrying the <Link#…> token) holds cumulative byte
  // counters. Its trailing 7 columns are ALWAYS Ipkts Ierrs Ibytes Opkts Oerrs
  // Obytes Coll; the optional Address (MAC) column shifts everything left, so index
  // from the RIGHT — Ibytes = p[len-5], Obytes = p[len-2]. Fixed indices (p[6]/p[9])
  // are correct only for rows carrying a MAC (en0); on an address-less default route
  // (utun*/VPN, lo0 — 10 fields, not 11) they read Opkts as RX and Coll (0) as TX.
  const ns = process.env.MACHUD_TEST_NETSTAT ?? (await sh("netstat", ["-ibn"]));
  let rx = 0;
  let tx = 0;
  for (const l of ns.split("\n")) {
    if (l.startsWith(`${iface} `) && l.includes("<Link#")) {
      const p = l.trim().split(/\s+/);
      rx = Number(p[p.length - 5]) || 0; // Ibytes
      tx = Number(p[p.length - 2]) || 0; // Obytes
      break;
    }
  }

  const now = Date.now();
  let rxBps = 0;
  let txBps = 0;
  // Diff only against the SAME interface: a default-route change (Wi-Fi↔Ethernet,
  // VPN up/down) would otherwise diff a fresh interface's large lifetime counters
  // against the previous one's baseline and emit a single enormous bogus spike.
  if (prev && prev.iface === iface && prev.rx <= rx && prev.tx <= tx) {
    const dt = (now - prev.t) / 1000;
    if (dt > 0) {
      rxBps = (rx - prev.rx) / dt;
      txBps = (tx - prev.tx) / dt;
    }
  }
  prev = { iface, rx, tx, t: now };

  // No IP address (D12): low glance-value and a needless leak in screenshots machud is built
  // to be. The interface name + rates are the valuable part.
  return { iface, rxBps, txBps, rxTotal: rx, txTotal: tx };
}
