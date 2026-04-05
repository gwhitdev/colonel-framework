# CLI and Template Workflow

create-colonel scaffolds a full app from the `colonel-framework` repository tarball.

## Generate a Project

```bash
bunx create-colonel my-app
```

## What Gets Generated

- Server bootstrap
- Route config
- Controllers + base controller
- Middleware examples (JSON write guard + trace header)
- Service example
- EJS views
- Upgrade script for framework dependency

## Post-Scaffold Upgrade Path

Generated apps include:

```bash
bun run upgrade:colonel
```

This updates @coloneldev/framework to latest published version.

## Template Maintenance

Within the monorepo:

- examples/web is the canonical implementation
- create-colonel fetches `packages/create-colonel/template` from the configured git ref
- docs should reflect framework and generated app behavior together
