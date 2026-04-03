# Controllers and Dependency Injection

Controllers should extend the base Controller class for shared helper behavior.

## Constructor Injection

Declare dependencies using static inject:

```ts
export class AppController extends Controller {
  static inject = [AppInfoService];

  constructor(private appInfoService: AppInfoService) {
    super();
  }
}
```

The container resolves dependencies when Kernel dispatches the controller action.

## Request-Scoped Access

Use request-scoped data through the HttpRequest passed into actions.

```ts
index(req: HttpRequest) {
  const userAgent = req.header('user-agent');
}
```

## Base Controller Helpers

The template base controller includes session helpers:

- requireSession(req)
- sessionGet(req, key)
- sessionPut(req, key, value)
- sessionForget(req, key)

Use these to avoid repeating guard logic in each controller.
