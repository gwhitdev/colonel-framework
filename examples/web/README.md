# Colonel Example Web App

[![Example](https://img.shields.io/badge/type-reference%20example-2F6FED)](#)
[![Runtime: Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh)
[![Scaffold-source](https://img.shields.io/badge/scaffold-source-colonel--framework-0A7B34)](https://github.com/gwhitdev/colonel-framework)

This workspace package is the canonical example Colonel application used for local development and scaffold evolution.

## Run

```bash
bun install
bun run start
```

Server runs at http://localhost:5000.

## Upgrade Colonel Version

For scaffolded apps, use this command to update to the latest published framework:

```bash
bun run upgrade:colonel
```

Note: this `examples/web` package uses a workspace dependency (`workspace:*`) to local framework code, so upgrade scripts are intended for generated apps.

## Tests

There are no app-specific automated tests in this package yet.
Run framework integration tests from the repository root:

```bash
bun run test
```
