# Colonel Documentation

Welcome to the official Colonel docs.

Colonel is a TypeScript-first web framework running on Bun with a compact, opinionated architecture:

- Kernel-driven request lifecycle
- Router with Controller@method mapping
- Dependency injection container
- Session support via request-scoped API
- EJS view rendering with layouts and partials
- CLI scaffolding via create-colonel

## Audience

These docs are written for:

- New users scaffolding their first app
- Contributors extending the framework internals
- Teams who want an opinionated, inspectable backend stack

## Read Next

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Routing](routing.md)
- [Controllers and Dependency Injection](controllers-and-di.md)
- [Views and Static Files](views-and-static.md)
- [Sessions](sessions.md)
- [CLI and Template Workflow](cli-and-template.md)
- [Stable API Contract](stable-api.md)
- [Release Checklist](release-checklist.md)
- [Roadmap](roadmap.md)
- [Extending Colonel](extending-colonel.md)

## GitHub Pages Setup

This docs section is ready for GitHub Pages from the docs directory.

1. Open repository Settings -> Pages.
2. Set Source to Deploy from a branch.
3. Select your default branch and /docs folder.
4. Save.

Once published, docs are available at:

https://gwhitdev.github.io/colonel-framework/
