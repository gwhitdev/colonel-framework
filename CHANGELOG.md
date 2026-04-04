# Changelog

All notable changes to this project are documented in this file.

## 1.0.0 - 2026-04-04

### Added

- Middleware pipeline with ordered execution and short-circuit support.
- Request validation API on `HttpRequest` with structured validation errors.
- Standardized response helpers and error primitives.
- Grouped route support and dedicated grouped-route tests.
- Startup diagnostics for route/controller/view misconfiguration.
- Integration coverage for diagnostics, sessions, and view rendering.
- Template parity and scaffold smoke tests.
- Release automation checks for version alignment, scaffold-command consistency, and public API surface.
- Stable API contract docs and release checklist documentation.

### Changed

- Example and template apps now include middleware examples and validated user creation route.
- CLI supports optional `--skip-install` scaffold flag.
- CI now runs full release-hardening checks.

### Notes

- `1.0.0` establishes the stable 1.x public API contract documented in `docs/stable-api.md`.