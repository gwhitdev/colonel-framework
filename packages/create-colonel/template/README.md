# Colonel App Template

[![Scaffolded by](https://img.shields.io/badge/scaffold-create--colonel-2F6FED)](../README.md)
[![Runtime: Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh)
[![Framework](https://img.shields.io/badge/framework-@coloneldev%2Fframework-0A7B34)](https://www.npmjs.com/package/@coloneldev/framework)

This template is copied into new projects created by `create-colonel`.

## Run

```bash
bun install
bun run start
```

Server runs at http://localhost:5000.

## Upgrade Colonel

Upgrade your app to the latest published framework:

```bash
bun run upgrade:colonel
```

## Tests

This template itself does not include app-specific automated tests yet.
Framework integration tests can be run from the monorepo root where Colonel source is developed:

```bash
bun run test
```
