# @coloneldev/framework

Core HTTP and routing runtime for Colonel applications.

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

The package currently exports framework primitives from the root entry:

- `Kernel`
- `Router`
- `HttpRequest`
- `redirect`
- static file helpers (`isStaticPath`, `toPublicFilePath`, `contentTypeFor`)

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
