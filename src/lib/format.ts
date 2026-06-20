export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

// Human-readable bytes. `perSec` appends "/s" for throughput readouts.
export function humanBytes(n: number | null, perSec = false): string {
  if (n == null || !isFinite(n) || n < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const s = v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1);
  return `${s} ${units[i]}${perSec ? "/s" : ""}`;
}

export function pct(n: number | null): string {
  return n == null || !isFinite(n) ? "—" : `${Math.round(n)}%`;
}

export function temp(c: number | null): string {
  return c == null || !isFinite(c) ? "—" : `${c.toFixed(0)}°C`;
}

// Right-pad to a fixed width for column alignment inside panels.
export function padEnd(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + " ".repeat(w - s.length);
}
