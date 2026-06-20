// Shared metric shapes. Every collector returns one of these; a collector that
// can't read a value sets it to null (rendered as "—") rather than throwing, so
// the dashboard degrades gracefully instead of crashing.

export interface CpuCore {
  usage: number; // 0-100
  cluster: "P" | "E";
}

export interface CpuMetric {
  model: string;
  usage: number; // overall 0-100
  cores: CpuCore[];
  pUsage: number; // performance-cluster average
  eUsage: number; // efficiency-cluster average
  pCount: number;
  eCount: number;
  loadAvg: [number, number, number];
  freqMHz: number | null; // not exposed without sudo on Apple Silicon
}

export interface NamedUsage {
  name: string;
  bytes: number;
}

export interface MemoryMetric {
  total: number;
  used: number;
  free: number;
  wired: number;
  compressed: number;
  app: number;
  usedPct: number; // 0-100
  pressure: "Normal" | "Elevated" | "High";
  swapTotal: number;
  swapUsed: number;
  topApps: NamedUsage[];
}

export interface GpuMetric {
  usage: number | null; // device utilization 0-100
  renderer: number | null;
  vram: number | null; // bytes in use
}

export interface DiskMetric {
  total: number;
  used: number;
  free: number;
  usedPct: number;
  readBps: number;
  writeBps: number;
  mount: string;
}

export interface NetMetric {
  iface: string;
  ip: string | null;
  rxBps: number;
  txBps: number;
  rxTotal: number;
  txTotal: number;
}

export interface BatteryMetric {
  present: boolean;
  pct: number;
  state: string; // charging / discharging / charged / AC
  charging: boolean;
  timeRemaining: string | null;
  cycleCount: number | null;
  healthPct: number | null;
  tempC: number | null;
}

export interface SensorsMetric {
  thermalPressure: "Nominal" | "Fair" | "Serious" | "Critical";
  speedLimit: number; // 0-100, CPU speed cap from thermal pressure
  batteryTempC: number | null;
  fanRpm: number | null; // null when not readable without sudo
}

export type AppearanceMode = "light" | "dark";

export interface AppearanceMetric {
  mode: AppearanceMode;
}

export interface Metrics {
  cpu: CpuMetric;
  memory: MemoryMetric;
  gpu: GpuMetric;
  disk: DiskMetric;
  net: NetMetric;
  battery: BatteryMetric;
  sensors: SensorsMetric;
  appearance: AppearanceMetric;
  ts: number;
}
