import { shallowRef, ref, onMounted, onUnmounted } from "vue";
import { collectAll } from "../lib/collectors";
import type { Metrics } from "../types";

export interface History {
  cpu: number[];
  gpu: number[];
  mem: number[];
  rx: number[];
  tx: number[];
}

const MAX_SAMPLES = 240;

// Drives the dashboard: polls every `intervalMs`, keeps the latest snapshot and
// rolling history rings for the graphs. Polls never overlap — a slow tick is
// skipped rather than queued.
export function useMetrics(intervalMs = 1000) {
  const metrics = shallowRef<Metrics | null>(null);
  const history = ref<History>({ cpu: [], gpu: [], mem: [], rx: [], tx: [] });
  const now = shallowRef(Date.now());

  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;
  let stopped = false;

  const push = (arr: number[], v: number) => {
    arr.push(v);
    if (arr.length > MAX_SAMPLES) arr.shift();
  };

  async function tick() {
    if (inFlight) return;
    inFlight = true;
    try {
      const m = await collectAll();
      if (stopped) return;
      now.value = m.ts;
      metrics.value = m;
      const h = history.value;
      push(h.cpu, m.cpu.usage);
      push(h.gpu, m.gpu.usage ?? 0);
      push(h.mem, m.memory.usedPct);
      push(h.rx, m.net.rxBps);
      push(h.tx, m.net.txBps);
      history.value = { ...h };
    } finally {
      inFlight = false;
    }
  }

  onMounted(() => {
    void tick();
    timer = setInterval(() => void tick(), intervalMs);
  });
  onUnmounted(() => {
    stopped = true;
    if (timer) clearInterval(timer);
  });

  return { metrics, history, now };
}
