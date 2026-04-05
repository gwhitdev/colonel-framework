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

## Token-Based Providers

The container supports class, string, and symbol tokens. For abstractions, register a token and inject that token.

```ts
const APP_CONFIG = "app.config";
const LOGGER = Symbol("logger");

container.register({ provide: APP_CONFIG, useValue: { baseUrl: "https://example.test" } });
container.register({ provide: LOGGER, useFactory: () => new Logger(), singleton: true });
container.register({ provide: UserService, useClass: UserService });
```

Then inject those tokens from controllers or services:

```ts
class UserController extends Controller {
  static inject = [APP_CONFIG, LOGGER, UserService];

  constructor(private config: { baseUrl: string }, private logger: Logger, private users: UserService) {
    super();
  }
}
```

## Test-Time Overrides

For tests, keep production wiring and override specific tokens with `instance`:

```ts
container.instance(LOGGER, new FakeLogger());
```

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
