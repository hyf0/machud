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

  return { present, pct, state, charging, timeRemaining, cycleCount, healthPct, tempC };
}
