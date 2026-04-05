# Stable API Contract

This page defines the public API and conventions that are considered stable for the 1.0 line.

## Public Framework Exports

The root export surface of `@coloneldev/framework` is stable and intentionally limited to:

- `Kernel`
- `Router`
- `HttpRequest`
- Response helpers from `HttpResponse` (`text`, `html`, `json`, `redirect`, `badRequest`, `notFound`, `unprocessableEntity`, `internalServerError`)
- Error primitives (`HttpException`, `ValidationError`)
- Static file helpers (`isStaticPath`, `toPublicFilePath`, `contentTypeFor`)
- Session primitives (`Session`, `InMemorySessionStore`)
- Container (`Container`)

Changes to this export surface should be treated as breaking unless explicitly documented in release notes.

## Stable Runtime Conventions

The following conventions are stable for generated apps and framework users.

### Routing

- Route handlers support either `Controller@method` strings or functional handlers.
- Grouped routes via `router.group(prefix, callback)` are stable.
- Route params are available via `req.params(key)`.

### Controllers and DI

- Controllers are resolved through the configured `controllerResolver`.
- Constructor injection via `static inject` is stable.
- DI tokens may be class constructors, strings, or symbols.
- Missing non-class tokens throw `Container binding not found for token: <token>`.
- Singleton bindings remain singleton for the container lifecycle unless overridden.
- Controller actions may return `Response`, objects, strings, or view payload tuples.

#### Stable DI Registration Styles

The following registration APIs are stable in 1.x:

- `bind(token, factory)` for transient values.
- `singleton(token, factory)` for memoized values.
- `instance(token, value)` for explicit prebuilt values.
- `register({ provide, useClass | useFactory | useValue, singleton? })` for provider-style wiring.

Provider style is additive and does not replace class-token behavior.

#### Test-Time Overrides

Use `instance` to replace dependencies for tests without changing application wiring:

```ts
class Clock {
	now() {
		return Date.now();
	}
}

container.singleton(Clock, () => new Clock());
container.instance(Clock, { now: () => 123 });
```

### Middleware

- Middleware runs in registration order.
- Middleware may short-circuit by returning a response without calling `next()`.
- Middleware examples are intentionally included in the scaffolded app before 1.0.

### Sessions

- Session support is request-scoped through `req.session`.
- `InMemorySessionStore` is the default development store.
- Production deployments should provide a shared store implementation.

### Views

- EJS view payload rendering with optional layout and partials is stable.
- Missing view files and misconfigured controller routes produce diagnostics.

## Compatibility Policy

For the 1.x line:

- Additive features are allowed.
- Behavior changes should preserve existing defaults when possible.
- Public export removals or incompatible signature changes require a major version bump.