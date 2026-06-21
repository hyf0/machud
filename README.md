<p align="center">
  <img alt="machud" src="https://raw.githubusercontent.com/hyf0/machud/main/.github/assets/banner.png" width="640">
</p>

<p align="center">
  A zero-config system monitor for the macOS terminal.
</p>

---

**machud is opinionated — that's the whole point.** Where [btop](https://github.com/aristocratos/btop) wins on deep configurability, machud wins on *beautiful + zero-config*: no settings, no config files, no layout knobs. The single curated wide-screen dashboard — Apple-Silicon-aware, following your macOS light/dark (or press `t` to override) — **is** the product. Want to tune everything yourself? Use btop. machud is the considered default that looks right out of the box and never asks for your password.

<p align="center">
  <img alt="machud dashboard" src="https://raw.githubusercontent.com/hyf0/machud/main/.github/assets/screenshot.png" width="860">
</p>

## Quick start

Requires macOS and Node ≥ 22.18. No install, no config, no password:

```bash
npx machud@latest
```

> **Using [Vite+](https://viteplus.dev)?** Try it with:
>
> ```bash
> vpx machud@latest
> ```

### From source

```bash
pnpm install
pnpm build      # bundle to dist/machud.mjs
pnpm start      # run the live dashboard (needs a real TTY)
```

Other entry points:

```bash
pnpm dev                       # dev mode with HMR
node dist/machud.mjs --once    # render ONE real-data frame to stdout and exit
```

`--once` needs no TTY — it prints a single frame with live readings and doubles as a pipe-friendly snapshot.

## Design

- **Zero-sudo first.** Every reading comes from unprivileged commands (`sysctl`, `vm_stat`, `ioreg`, `pmset`, `netstat`, `df`, `ps`) plus Node's `os`. Metrics that would need `sudo` — precise per-cluster frequency, GPU watts, fan RPM, die temperatures — are left out rather than shown as dead rows. They never block startup, and machud never asks for your password.
- **Never crash, just degrade.** Each collector returns safe nulls on failure, and any throwing collector is swapped for its empty default. A missing metric is a dash, not a stack trace.
- **Apple-Silicon-aware.** P/E-core clusters, unified-memory pressure, and live battery wattage are first-class — with graceful single-cluster fallback on Intel.

## Contributing

machud is opinionated by design. **Bug reports are welcome; feature PRs opened without a prior, agreed-upon issue are closed directly**, and theming / feature / aesthetic changes are generally not accepted. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Credits

machud was inspired by [Stats](https://github.com/exelban/stats) by [@exelban](https://github.com/exelban) — its idea, brought to the terminal.
