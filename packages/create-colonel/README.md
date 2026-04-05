# create-colonel

Scaffold a new Colonel app from the command line.

## Why Users Like It

- scaffolds a working app with practical defaults
- includes middleware and validation-ready patterns out of the box
- keeps generated structure aligned with docs and framework conventions
- supports a simple default flow plus optional `--skip-install`

[![npm version](https://img.shields.io/npm/v/create-colonel)](https://www.npmjs.com/package/create-colonel)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](../../LICENSE)
[![Runtime: Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh)
[![Template](https://img.shields.io/badge/template-source-github%20tarball-2F6FED)](https://github.com/gwhitdev/colonel-framework)

## Usage

```bash
bunx create-colonel my-app
```

Optional flag:

```bash
bunx create-colonel my-app --skip-install
```

Template source flags:

```bash
bunx create-colonel my-app --template-ref main
```

```bash
bunx create-colonel my-app --template-tarball-url https://codeload.github.com/gwhitdev/colonel-framework/tar.gz/main
```

Telemetry flags:

```bash
bunx create-colonel my-app \
	--telemetry yes \
	--telemetry-endpoint https://colonel-telemetery.vercel.app/api/ingest
```

By default, when telemetry consent is `yes`, create-colonel uses the public provisioning endpoint to fetch app credentials automatically.

Optional secure provisioning override:

```bash
bunx create-colonel my-app \
	--telemetry yes \
	--telemetry-endpoint https://colonel-telemetery.vercel.app/api/ingest \
	--telemetry-provision-endpoint https://colonel-telemetery.vercel.app/api/provision-app \
	--telemetry-provision-token <token>
```

When telemetry is enabled and provisioning succeeds, the scaffolded `.env` receives:

- `COLONEL_TELEMETRY_ENABLED`
- `COLONEL_TELEMETRY_ENDPOINT`
- `COLONEL_TELEMETRY_APP_ID`
- `COLONEL_TELEMETRY_KEY`

Regardless of telemetry consent, create-colonel sends a lightweight scaffold-created ping so telemetry can maintain:

- total app scaffolds
- total telemetry opt-outs

When telemetry consent is `yes`, create-colonel prints links to:

- telemetry privacy notice (`/privacy`)
- telemetry opt-out page (`/opt-out`)

Use `--skip-install` when you only want scaffolded files and prefer to install dependencies later.

Then run your new app:

```bash
cd my-app
bun run start
```

## What It Does

- Fetches the app template tarball from the `colonel-framework` repository.
- Extracts scaffold source files from the tarball into a new folder.
- Uses `packages/create-colonel/template` when present, otherwise falls back to `examples/web`.
- Sets the generated `package.json` name from the folder name.
- Installs dependencies automatically.
- Prints next-step commands.

## Requirements

- Bun installed on your machine.
- Network access to fetch the template tarball.
- `@coloneldev/framework` published and available on npm.

## Local Development

From this monorepo, you can run the generator directly:

```bash
bun packages/create-colonel/src/cli.ts my-app
```

When run inside this repository, the CLI auto-links the local framework package for easier development.

## Tests

There are no dedicated automated tests for this package yet.

Recommended smoke test from repository root:

```bash
rm -rf /tmp/colonel-smoke && bun packages/create-colonel/src/cli.ts /tmp/colonel-smoke
cd /tmp/colonel-smoke
bun run start
```

## Publishing

```bash
cd packages/create-colonel
npm publish --access public
```

Package: `create-colonel`
