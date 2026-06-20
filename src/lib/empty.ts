import type { Metrics } from "../types";

// A fully-zeroed Metrics snapshot. Used as the initial value before the first
// poll lands, and as the per-collector fallback when one throws.
export function emptyMetrics(): Metrics {
  return {
    cpu: {
      model: "CPU",
      usage: 0,
      cores: [],
      topProcs: [],
      pUsage: 0,
      eUsage: 0,
      pCount: 0,
      eCount: 0,
      loadAvg: [0, 0, 0],
      freqMHz: null,
    },
    memory: {
      total: 0,
      used: 0,
      free: 0,
      wired: 0,
      compressed: 0,
      app: 0,
      usedPct: 0,
      pressure: "Normal",
      swapTotal: 0,
      swapUsed: 0,
      topApps: [],
    },
    gpu: { usage: null, renderer: null, vram: null },
    disk: { total: 0, used: 0, free: 0, usedPct: 0, readBps: 0, writeBps: 0, mount: "/" },
    net: { iface: "—", rxBps: 0, txBps: 0, rxTotal: 0, txTotal: 0 },
    battery: {
      present: false,
      pct: 0,
      state: "—",
      charging: false,
      timeRemaining: null,
      cycleCount: null,
      healthPct: null,
      tempC: null,
      adapterWatts: null,
      chargeWatts: null,
    },
    sensors: { thermalPressure: "Nominal", speedLimit: 100, batteryTempC: null, fanRpm: null },
    appearance: { mode: "light" },
    ts: 0,
  };
}
