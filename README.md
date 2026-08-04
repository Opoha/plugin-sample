# Sample Plugin — custom store notes (teaching example)

Official [`@opoha/plugin-sample`](https://www.npmjs.com/package/@opoha/plugin-sample) is the **reference custom plugin** for Opoha authors.

It is intentionally richer than a “hello world”: it implements a small **Store Notes** feature so you can copy the patterns into your own `@scope/plugin-*` package. It also keeps the historic **loader smoke** surface (`samplePing`, `sample.ping`, `PluginSampleEvent`) so core’s discovery tests stay green.

| | |
| --- | --- |
| npm | `@opoha/plugin-sample` |
| Plugin id | `sample` |
| Contract | `0.1` |
| Repo | [Opoha/plugin-sample](https://github.com/Opoha/plugin-sample) |
| Role | Teaching / loader fixture — **not** part of the v1.0 certified commerce matrix |

## What this plugin demonstrates

Think of Store Notes as a merchant sticky-note board (draft → published → archived), optionally linked to a product id:

| Capability | How this repo shows it |
| --- | --- |
| Plugin definition | `definePlugin({ id: 'sample', boot })` in `src/index.ts` |
| GraphQL contributions | Queries `sampleNotes` / `sampleNote` + CRUD mutations |
| Provider tokens | `sample.ping` (smoke) and `sample.notes` (domain API) |
| Domain events | Listener on `PluginSampleEvent` + `ProductDeleted` cascade |
| Scheduled jobs | `prune-archived-notes` cron (no BullMQ import in the plugin) |
| Rule actions | `sample.logNote` for automation / workflow hosts |
| Admin UI hooks | Nav, page, settings, dashboard widget, product tab |
| Permissions | `plugin:sample:read` \| `write` \| `configure` |
| Plugin-owned DB | TypeORM entity + migration via `@opoha/plugin-sample/database` |

**Boundaries (do not violate in your plugin):**

- Never edit core tables or import `@opoha/core` internals
- Never put provider secrets in admin config JSON — use env vars
- Opaque UUIDs only for core references (no FKs into core)
- Own migrations table: `opoha_migrations_sample` (never share core `migrations`)

## Feature overview (Store Notes)

```text
createSampleNote → list/filter → update status → archive → nightly prune
                         ↘ optional productId link
                         ↘ ProductDeleted removes linked notes
```

Runtime state in this package is an in-memory store (`src/notes.ts`) so unit tests stay fast. The durable schema is declared with TypeORM under `src/entities` + `src/migrations` for hosts that aggregate plugin migrations.

## Install

```bash
pnpm add @opoha/plugin-sample
```

Add to your app `opoha.config.json`:

```json
{
  "plugins": ["@opoha/plugin-sample"]
}
```

Or point a local checkout at the loader:

```bash
pnpm install && pnpm build
export OPOHA_PLUGINS="$(pwd)"
```

Core discovers plugins dynamically and imports `dist/index.js` — **core never statically imports this package**.

## GraphQL surface

| Name | Kind | Purpose |
| --- | --- | --- |
| `samplePing` | query | Loader smoke — returns `"pong"` |
| `sampleNotes` | query | List notes (`status?`, `productId?`) |
| `sampleNote` | query | Fetch one note by id |
| `createSampleNote` | mutation | Create a note |
| `updateSampleNote` | mutation | Patch title / body / status / product link |
| `deleteSampleNote` | mutation | Delete by id |

## Admin contributions

| Kind | Path / id | Permission |
| --- | --- | --- |
| Nav + page | `/plugins/sample` | `plugin:sample:read` |
| Settings | `/plugins/sample/settings` | `plugin:sample:configure` |
| Widget | `sample-notes-widget` | `plugin:sample:read` |
| Product tab | `sample-product-notes` | `plugin:sample:read` |

`opoha-admin` never imports this package — it mounts extension points from the admin contribution registry.

## Database (plugin-owned)

```ts
import {
  entities,
  migrations,
  MIGRATIONS_TABLE_NAME,
  PLUGIN_ID,
} from '@opoha/plugin-sample/database';
```

| Export | Value |
| --- | --- |
| Table | `plugin_sample_notes` |
| Migrations table | `opoha_migrations_sample` |
| Plugin id | `sample` |

## Layout

```text
src/
  index.ts                 # definePlugin boot — all registrations
  notes.ts                 # domain + Zod validation + in-memory store
  database.ts              # ./database export surface
  entities/                # TypeORM entities (ADR-0005)
  migrations/              # TypeORM migrations (namespaced table)
  index.test.ts            # unit + registration tests
opoha.plugin.json          # manifest for discovery
```

## Develop

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Copy this for your own plugin

1. `opoha generate plugin my-feature` (official template) **or** fork this repo
2. Rename `id`, package name, table prefix (`plugin_<id>_…`), and permissions
3. Keep entities/migrations on `./database` — never register them through `PluginContext`
4. Register GraphQL / admin / listeners / jobs only through `ctx.*` APIs from `@opoha/plugin-sdk`
5. Leave commerce engines (payment, shipping, tax, …) to dedicated plugins unless you are building one

For production commerce capabilities prefer the certified packages (`@opoha/plugin-stripe`, `@opoha/plugin-wishlist`, …). Use **this** package as the “how do I structure a custom feature?” guide.

## License

MIT © [Opoha](https://github.com/Opoha)
