# Architecture

Colonel follows a simple flow:

1. Bun receives the request.
2. Kernel builds an HttpRequest object.
3. Kernel runs middleware pipeline.
4. Router matches route and resolves handler.
5. Kernel resolves controller through the container.
6. Controller returns a Response, JSON object, or view payload.
7. Kernel normalizes output to a Response.
8. Session state is committed and Set-Cookie is emitted when needed.

## Core Packages

- packages/framework: reusable runtime (Kernel, Router, HttpRequest, Session, Container)
- packages/create-colonel: CLI scaffolder and template
- examples/web: canonical app implementation

## Design Principles

- Explicit wiring over hidden magic
- Request-scoped state over shared mutable state
- Extend by composition first, then framework internals
- Keep generated apps close to framework conventions
