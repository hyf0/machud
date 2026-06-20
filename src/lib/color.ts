// Small colour helpers for the gradient meters/graphs, plus the D11 colour-tier gate.

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
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
// 256-colour — there we degrade to a single solid accent instead of a (banded) gradient. We key
// off COLORTERM, the same signal vue-tui itself uses to decide whether to emit 24-bit (38;2)
// codes — FORCE_COLOR only toggles colour on/off, it does NOT mean truecolor.
export function supportsTruecolor(): boolean {
  return /truecolor|24bit/i.test(process.env.COLORTERM ?? "");
}
