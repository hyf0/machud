# machud architecture

machud is a vue-tui terminal dashboard that mirrors [Stats](https://github.com/exelban/stats).
This record captures the durable *why* behind the structure and the data sources.

> Product boundaries that must not drift live in [decisions.md](./decisions.md) —
> read it before changing scope, layout, or data-privilege posture.

## Layers

```
src/
  main.ts                 entry — interactive mount (alternateScreen: takes over the
                          terminal like btop, restores shell on quit), OR `--once` snapshot
  App.vue                 SHIPPED: flat 3-row grid. TARGET: DESIGN.md 3-tier + 2-tier
                          responsive (RD4/RD5) — don't treat the 3-row grid as the contract
  theme.ts                system-following light/dark palettes + levelColor()
  types.ts                Metrics shapes (one interface per module)
  composables/
    useMetrics.ts         1s non-overlapping poll loop + rolling history rings
  lib/
    exec.ts               sh() — exec that resolves "" on any failure
    format.ts             humanBytes / pct / temp / clamp
    sparkline.ts          block sparkline + bar cell helpers
    empty.ts              emptyMetrics() — initial + per-collector fallback
    collectors/           one file per module, each async + self-degrading
      cpu / memory / gpu / disk / network / battery / sensors / appearance / index(collectAll)
  components/
    Panel.vue Bar.vue Sparkline.vue        shared widgets
    panels/*Panel.vue HeaderBar.vue        one per module
```

Data flow: `collectAll()` runs all collectors in parallel → `useMetrics` stores the
snapshot + pushes into history rings → `App.vue` applies the system appearance
theme and passes slices to panels → panels render bars/sparklines. Panels are pure
(props in, no I/O).

## Zero-sudo data sources (decided up front — see brainstorm)

Goal: open-the-box, no password prompt. Everything below is unprivileged.

| Module   | Source                                                                    |
| -------- | ------------------------------------------------------------------------- |
| CPU      | `os.cpus()` delta sampling; `sysctl hw.perflevel0/1.logicalcpu` for P/E split |
| Memory   | `vm_stat` (pages), `sysctl vm.swapusage`, `ps -A -o rss,comm -m` (top apps) |
| GPU      | `ioreg -c IOAccelerator` → PerformanceStatistics "Device Utilization %"    |
| Disk     | `df -k -P /`; `ioreg -c IOBlockStorageDriver` "Bytes (Read/Write)" diffed  |
| Network  | `route get default` + `netstat -ibn` byte counters diffed; `os.networkInterfaces()` (IP collected today but NOT displayed — dropped per D12; collector field removed in RD2) |
| Battery  | `pmset -g batt`; `ioreg -c AppleSmartBattery` (CycleCount, capacities, Temperature) |
| Sensors  | `pmset -g therm` (CPU speed cap → thermal pressure); battery pack temp     |
| Appearance | `defaults read -g AppleInterfaceStyle` (`Dark` = dark; absent/empty = light) |

### Known approximations / limits (unprivileged)

- **CPU per-cluster P/E:** logical CPUs are assumed numbered efficiency-first on
  Apple Silicon (first `perflevel1.logicalcpu` indices = E). Verified plausible on
  M3 Pro (E cluster busier at idle). Exact mapping needs powermetrics.
- **CPU frequency:** not exposed without sudo on Apple Silicon → `freqMHz = null`.
- **Memory "used"** = wired + compressed + active (Activity-Monitor/htop style),
  excluding reclaimable file cache, so it doesn't read ~95% on a cache-heavy Mac.
- **Sensors:** die temps and fan RPM require SMC reads (sudo) → shown as "—". We
  surface thermal pressure + battery pack temp, which ARE free.
- **Appearance:** light/dark follows macOS system preference automatically. There
  is no user-facing theme switch; `MACHUD_TEST_APPEARANCE` exists only so
  `pnpm verify` can exercise both palettes without changing host settings.

There is **no** "enhanced mode." A sudo/powermetrics path was considered and **dropped** (D2,
2026-06-20): precise per-cluster load, GPU/ANE watts, fan RPM, die temps, and total system power
stay `—` forever. Never asking for a password is part of the product.

## Verification

`vp test` is broken by an upstream vite-plus version skew. The live path is
`node dist/machud.mjs --once` — primes delta collectors, waits 700ms, reads real
data, renders one frame, exits. No TTY needed.

## Scope status

Shipped: CPU (P/E), Memory, GPU, Disk, Network, Battery, Sensors, Clock (header),
system-following light/dark appearance, `pnpm verify` gate, alternate-screen takeover.

**In progress — the visual redesign** (see [`/DESIGN.md`](../../DESIGN.md), the aesthetic anchor;
D9). It moves machud to a "cool but refined" Everforest identity with a 3-tier layout, and is
staged RD0–RD5 (safety-net-first) in [backlog.md](./backlog.md). New collectors it adds:
**memory pressure** (`sysctl kern.memorystatus_vm_pressure_level`), **battery adapter + charge
watts** (`AdapterDetails.Watts`; `Voltage·Amperage/1e6`). New rendering concerns: a **truecolor
color-tier fallback** (D11 — Terminal.app is 256-color) and an **Apple-Silicon/Intel P/E branch**.

Decisions changed this round: **responsive reopened** (D4 — 2-tier, auto-adapt like D8, built
last); **sudo dropped** (D2). Still deferred from 9-module Stats parity: **Bluetooth**, a
standalone **Clock** module (both after the redesign).
