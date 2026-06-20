import { sh } from "../exec";
import type { SensorsMetric } from "../../types";

// Apple Silicon gates CPU/GPU die temperatures and fan RPM behind SMC reads that
// require sudo (powermetrics). Without privileges we surface what IS free:
// thermal pressure (the CPU speed cap macOS applies) and the battery pack temp.
export async function collectSensors(): Promise<SensorsMetric> {
  const therm = await sh("pmset", ["-g", "therm"]);
  const speedLimit = Number(therm.match(/CPU_Speed_Limit\s*=\s*(\d+)/)?.[1] ?? 100);
  let thermalPressure: SensorsMetric["thermalPressure"] = "Nominal";
  if (speedLimit < 50) thermalPressure = "Critical";
  else if (speedLimit < 75) thermalPressure = "Serious";
  else if (speedLimit < 100) thermalPressure = "Fair";

  const io = await sh("ioreg", ["-r", "-c", "AppleSmartBattery", "-w", "0"]);
  const tRaw = io.match(/"Temperature" = (\d+)/)?.[1];
  const batteryTempC = tRaw ? Number(tRaw) / 100 : null;

  return { thermalPressure, speedLimit, batteryTempC, fanRpm: null };
}
