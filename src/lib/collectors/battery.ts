import { sh } from "../exec";
import { clamp } from "../format";
import type { BatteryMetric } from "../../types";

export async function collectBattery(): Promise<BatteryMetric> {
  const batt = await sh("pmset", ["-g", "batt"]);
  const present = /InternalBattery/.test(batt);
  const pct = Number(batt.match(/(\d+)%/)?.[1] ?? (present ? 0 : 100));
  const state =
    batt.match(/\d+%;\s*([^;]+);/)?.[1]?.trim() ||
    (batt.includes("AC Power") ? "AC power" : "unknown");
  const charging = /charging/i.test(state) && !/not charging/i.test(state);
  const tm = batt.match(/(\d+):(\d+)\s+remaining/);
  const timeRemaining = tm && !(tm[1] === "0" && tm[2] === "00") ? `${tm[1]}:${tm[2]}` : null;

  // Health, cycle count, and pack temperature come from the SMC-backed
  // AppleSmartBattery service (no privileges required).
  const io = await sh("ioreg", ["-r", "-c", "AppleSmartBattery", "-w", "0"]);
  const ioNum = (k: string): number | null => {
    const m = io.match(new RegExp(`"${k}" = (-?\\d+)`));
    return m ? Number(m[1]) : null;
  };
  const cycleCount = ioNum("CycleCount");
  const design = ioNum("DesignCapacity");
  const rawMax = ioNum("AppleRawMaxCapacity");
  const healthPct = design && rawMax ? clamp((rawMax / design) * 100) : null;
  const tRaw = ioNum("Temperature");
  const tempC = tRaw != null ? tRaw / 100 : null;

  // Real-time charge power = Voltage(mV) · Amperage(mA) / 1e6 = W. ioreg reports Amperage as an
  // UNSIGNED 64-bit int, so reinterpret as signed (+ into the battery / charging, − out /
  // discharging) BEFORE computing. MACHUD_TEST_AMPERAGE is a test-only input hook (verify.mjs).
  const toSigned64 = (s: string | null | undefined): number | null => {
    if (s == null) return null;
    try {
      let v = BigInt(s);
      if (v >= 1n << 63n) v -= 1n << 64n;
      return Number(v);
    } catch {
      return null;
    }
  };
  const voltage = ioNum("Voltage"); // mV
  const rawAmp = process.env.MACHUD_TEST_AMPERAGE ?? io.match(/"Amperage" = (-?\d+)/)?.[1];
  const amperage = toSigned64(rawAmp); // signed mA
  const chargeWatts = voltage != null && amperage != null ? (voltage * amperage) / 1e6 : null;

  // Adapter max wattage — live-detected (AdapterDetails.Watts), varies by cable/charger; only on AC.
  const externalConnected = /"ExternalConnected" = Yes/.test(io);
  const wattsMatch = io.match(/"Watts"=(\d+)/);
  const adapterWatts = externalConnected && wattsMatch ? Number(wattsMatch[1]) : null;

  return {
    present,
    pct,
    state,
    charging,
    timeRemaining,
    cycleCount,
    healthPct,
    tempC,
    adapterWatts,
    chargeWatts,
  };
}
