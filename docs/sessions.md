# Sessions

Colonel includes a request-scoped session API in framework.

## How It Works

- Kernel optionally initializes a session for each request.
- Session ID is stored in an HTTP-only cookie.
- Payload is persisted via SessionStore.
- Default store is InMemorySessionStore.

## Enabling Sessions

In server bootstrap:

```ts
new Kernel(router, middleware, {
  viewsRoot,
  session: {
    enabled: true,
    cookieName: 'colonel.sid',
    ttlSeconds: 60 * 60 * 24 * 7,
  },
  controllerResolver,
}, container)
```

## Using Sessions in Controllers

```ts
const visits = (this.sessionGet<number>(req, 'visits') ?? 0) + 1;
this.sessionPut(req, 'visits', visits);
```

## Invalidating Sessions

Use request.session.invalidate() if you need logout-style behavior.

## Production Notes

InMemorySessionStore is fine for local dev and small single-instance deployments.
For multi-instance production, provide a custom SessionStore backed by shared storage.
