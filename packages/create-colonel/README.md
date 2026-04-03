# create-colonel

Scaffold a new Colonel app from the command line.

[![npm version](https://img.shields.io/npm/v/create-colonel)](https://www.npmjs.com/package/create-colonel)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](../../LICENSE)
[![Runtime: Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh)
[![Template](https://img.shields.io/badge/template-included-2F6FED)](template)

## Usage

```bash
bun create colonel my-app
```

Alternative entry points:

```bash
bunx create-colonel my-app
npx create-colonel my-app
npm create colonel@latest my-app
```

Then run your new app:

```bash
cd my-app
bun run start
```

## What It Does

- Copies the app template into a new folder.
- Sets the generated `package.json` name from the folder name.
- Installs dependencies automatically.
- Prints next-step commands.

## Requirements

- Bun installed on your machine.
- `@coloneldev/framework` published and available on npm.

## Local Development

From this monorepo, you can run the generator directly:

```bash
bun packages/create-colonel/src/cli.ts my-app
```

When run inside this repository, the CLI auto-links the local framework package for easier development.

## Tests

There are no dedicated automated tests for this package yet.

Recommended smoke test from repository root:

```bash
rm -rf /tmp/colonel-smoke && bun packages/create-colonel/src/cli.ts /tmp/colonel-smoke
cd /tmp/colonel-smoke
bun run start
```

## Publishing

```bash
cd packages/create-colonel
npm publish --access public
```

Package: `create-colonel`
