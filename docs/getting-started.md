# Getting Started

## Prerequisites

- Bun installed
- Git

Install Bun if needed:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Create a New App

```bash
bun create colonel my-app
cd my-app
bun install
bun run start
```

Open http://localhost:5000.

## Upgrade an Existing App

```bash
bun run upgrade:colonel
```

## Local Development in the Monorepo

```bash
bun install
bun run start
```

The reference app lives in examples/web.

## First Places to Explore

- src/bootstrap/server.ts
- src/config/routes/web.ts
- src/app/Http/Controllers/AppController.ts
- resources/views/base/index.ejs
