# Sample Plugin

Official [`@opoha/plugin-sample`](https://www.npmjs.com/package/@opoha/plugin-sample) — Minimal sample plugin for Opoha loader integration tests.

| | |
| --- | --- |
| npm | `@opoha/plugin-sample` |
| Plugin id | `sample` |
| Contract | `0.1` |
| Repo | [Opoha/plugin-sample](https://github.com/Opoha/plugin-sample) |

## Install

```bash
pnpm add @opoha/plugin-sample
```

Add the package to your app `opoha.config.json` `"plugins"` array (or set `OPOHA_PLUGINS` / `OPOHA_PLUGINS_PATH` for a local checkout).

## What it registers

- GraphQL query contribution `samplePing`
- Permission `plugin:sample:read`
- Listener on `PluginSampleEvent`
- Admin nav item under `/plugins/sample`

## Load (local checkout)

```bash
pnpm install && pnpm build
export OPOHA_PLUGINS="$(pwd)"
```

Core discovers plugins dynamically and imports `dist/index.js` — **core never statically imports this package**.

## Develop

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## License

MIT © [Opoha](https://github.com/Opoha)
