# @coloneldev/framework

Core HTTP and routing runtime for Colonel applications.

## Why Developers Pick It

From the runtime user's perspective:

- explicit routing and controller mapping over hidden conventions
- constructor injection that is readable and debuggable
- startup diagnostics for common misconfigurations
- stable 1.x API surface with documented guarantees

See the user-focused overview at https://gwhitdev.github.io/colonel-framework/why-colonel.

[![npm version](https://img.shields.io/npm/v/@coloneldev/framework)](https://www.npmjs.com/package/@coloneldev/framework)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](../../LICENSE)
[![Runtime: Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh)
[![Tests](https://img.shields.io/badge/tests-bun%20test-0A7B34)](src/Http/Kernel.container.test.ts)

## Install

```bash
bun add @coloneldev/framework
```

or

```bash
npm install @coloneldev/framework
```

## Exports

The package exports stable framework primitives from the root entry:

- `Kernel`
- `Router`
- `HttpRequest`
- response helpers (`text`, `html`, `json`, `redirect`, `badRequest`, `notFound`, `unprocessableEntity`, `internalServerError`)
- error primitives (`HttpException`, `ValidationError`)
- `Session` and `InMemorySessionStore`
- static file helpers (`isStaticPath`, `toPublicFilePath`, `contentTypeFor`)
- telemetry helpers (`TelemetryClient`, `createTelemetryClientFromEnv`)
- `Container`

For detailed 1.x stability guarantees, see [Stable API Contract](https://gwhitdev.github.io/colonel-framework/stable-api).

## Example

```ts
import { Container, Kernel, Router } from "@coloneldev/framework";

const router = new Router();
const container = new Container();
const kernel = new Kernel(router, [], {}, container);
```

## Tests

Run tests from this package directory:

```bash
bun run test
```

Or from the repository root:

```bash
bun run test:framework
```

## License

MIT
