![Colonel Web Framework](colonel.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![SPDX License](https://img.shields.io/badge/SPDX-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)

## About Colonel
Colonel is a small TypeScript web framework experiment running on Bun.

## Download And Run Locally

1. Install Bun if you do not already have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Clone the repository:

```bash
git clone https://github.com/<your-user>/colonel.git
cd colonel
```

3. Install dependencies:

```bash
bun install
```

4. Start the development server:

```bash
bun run start
```

5. Open your browser:

```text
http://localhost:5000
```

## Getting Started

Install dependencies:

```bash
bun install
```

Run the app:

```bash
bun run start
```

By default, the HTTP server runs on port `5000`.

## Scaffold A New App

Colonel can be scaffolded from the command line similar to other frameworks.

After publishing packages:

```bash
bun create colonel my-app
cd my-app
bun run start
```

During local development in this monorepo, you can test the scaffolder directly:

```bash
bun packages/create-colonel/src/cli.ts my-app
cd my-app
bun run start
```

## Framework Outline (Current)

The framework currently includes:

- A custom HTTP kernel to handle request lifecycle and error handling.
- A lightweight router with support for static and parameterized routes.
- A request abstraction (`HttpRequest`) for headers, query, body, and route params.
- Dynamic controller resolution using route handler strings (`Controller@method`).
- EJS view rendering with support for:
	- Child templates
	- Layout templates
	- Partials (for example title and footer)
- Basic JSON and plain text response normalization.

Current project structure is organized as a Bun workspace:

- [packages/framework/](packages/framework/) for reusable framework internals (HTTP, container, view handling)
- [apps/web/src/app/](apps/web/src/app/) for user land controllers, services, models, and app logic
- [apps/web/src/config/routes/](apps/web/src/config/routes/) for route registration
- [apps/web/resources/views/](apps/web/resources/views/) for EJS templates
- [apps/web/src/bootstrap/](apps/web/src/bootstrap/) for server startup wiring

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for full details.

## Contributing

Contributions are welcome while the framework evolves.

Recommended workflow:

1. Fork the repository.
2. Create a branch for your change (`feature/...` or `fix/...`).
3. Make focused, minimal commits.
4. Verify the project still runs:

```bash
bun run start
```

5. Open a pull request with:
	 - A short summary of what changed
	 - Why the change is needed
	 - Any follow-up work or known limitations

Contribution guidelines:

- Keep framework internals in [packages/framework/](packages/framework/) and app-specific code in [apps/web/src/app/](apps/web/src/app/).
- Prefer small, reviewable pull requests.
- Preserve existing coding style and naming conventions.
- Include docs updates when behavior or APIs change.
