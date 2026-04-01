# Colonel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![SPDX License](https://img.shields.io/badge/SPDX-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)

Colonel is a small TypeScript web framework experiment running on Bun.

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

Current project structure is organized into:

- [framework/](framework/) for core framework internals (HTTP, container, view handling)
- [app/](app/) for user land controllers, services, models, and app logic
- [routes/](routes/) for route registration
- [resources/views/](resources/views/) for EJS templates
- [bootstrap/](bootstrap/) for server startup wiring

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

- Keep framework internals in [framework/](framework/) and app-specific code in [app/](app/).
- Prefer small, reviewable pull requests.
- Preserve existing coding style and naming conventions.
- Include docs updates when behavior or APIs change.
