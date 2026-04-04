# Colonel 1.0 Release Notes

Colonel 1.0 marks the first stable release line.

## Highlights

- Stable public API contract for framework exports and runtime conventions.
- Milestone-driven hardening across middleware, validation, diagnostics, and release automation.
- Improved generated-app defaults with middleware examples and validation-ready controllers.

## What Is Stable In 1.x

- Routing, grouped routes, and controller mapping patterns.
- Constructor injection via `static inject`.
- Session API and default session behavior.
- EJS view payload and layout/partial composition model.
- Framework root export surface documented in `docs/stable-api.md`.

## Upgrade Notes

- Generated template dependency now targets `@coloneldev/framework@^1.0.0`.
- Use `bun run upgrade:colonel` inside generated apps to move to latest published framework.

## Validation Gate Used For 1.0

- `bun run test:milestone4`
- `bun run tsc --noEmit`