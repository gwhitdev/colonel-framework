# Extending Colonel

This guide covers practical extension points without forking framework internals first.

## 1. Add Services

Create app services under src/app/Services and inject them into controllers using static inject.

## 2. Add Middleware

Kernel accepts middleware array in construction.

Middleware signature:

```ts
(req, next) => Promise<Response> | Response
```

Use middleware for auth, logging, or request guards.

## 3. Add Custom Session Store

Implement SessionStore with:

- get(sessionId)
- set(sessionId, payload, ttlSeconds)
- delete(sessionId)

Then pass store in Kernel session options.

## 4. Add Response Helpers

If your app needs consistent API envelopes, add helper methods in your base controller.

## 5. Evolve Route Modules

As routes grow:

- split by domain
- import and mount route groups in web.ts
- keep controller methods small and composable

## 6. Contribute to Framework

When app-level composition is not enough:

- add focused tests first in packages/framework/src/Http
- implement minimal change in framework runtime
- document new behavior in docs and README updates
