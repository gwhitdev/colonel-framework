# @coloneldev/framework

Core HTTP and routing runtime for Colonel applications.

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

## License

MIT
