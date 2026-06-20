// Small colour helpers for the gradient meters/graphs, plus the D11 colour-tier gate.
import chalk from "chalk";

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const ch = (a: number, b: number) => {
    const v = parseInt(h.slice(a, b), 16);
    return Number.isFinite(v) ? v : 0;
  };
  return [ch(0, 2), ch(2, 4), ch(4, 6)];
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Linear interpolation between two hex colours (t in 0..1).
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

// Same-hue luminance ramp: a dimmer shade of `hex` → `hex`, across n steps. This is the
// gentle gradient-meter look (no complementary hue clash; DESIGN.md "same-hue luminance ramp").
export function ramp(hex: string, n: number): string[] {
  const dim = mix("#000000", hex, 0.5);
  return Array.from({ length: n }, (_, i) => mix(dim, hex, n > 1 ? i / (n - 1) : 1));
}

// D11: gradients are a TRUECOLOR enhancement, not a guarantee. macOS's default Terminal.app is
// 256-colour — there we degrade to a solid accent instead of a (banded) gradient. We gate on the
// SAME signal vue-tui uses to decide whether to emit 24-bit (38;2) codes: chalk's detected level
// (>= 3 means truecolor). Keying off the identical source means the gradient decision and the
// renderer's colour emission can never diverge (no lost gradient on kitty/ssh; no 256-colour banding).
export function supportsTruecolor(): boolean {
  return chalk.level >= 3;
}
