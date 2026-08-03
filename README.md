# Sample Plugin

Minimal `@opoha/plugin-sample` used to prove the Opoha plugin loader (MVP D-11).

## What it registers

- GraphQL query contribution `samplePing`
- Permission `plugin:sample:read`
- Listener on `PluginSampleEvent`
- Admin nav item under `/plugins/sample`

## Load

```bash
pnpm install && pnpm build
export OPOHA_PLUGINS="$(pwd)"
```

Core discovers via `OPOHA_PLUGINS` / `OPOHA_PLUGINS_PATH` and dynamically imports `dist/index.js` — core never statically imports this package.
