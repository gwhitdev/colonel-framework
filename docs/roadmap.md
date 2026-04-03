# 1.0.0 Roadmap

This plan is ordered to get Colonel from a solid beta-style core to a stable first 1.0 release. Each milestone has clear dependencies and a practical exit criterion.

## Milestone 1: Core HTTP Stability

Goal: finish the request lifecycle so the framework has a predictable, production-ready HTTP surface.

Tasks:

- Add a middleware pipeline with explicit ordering and short-circuit support.
- Add first-class request validation or form request support.
- Add standardized error handling for 404, 500, and controller exceptions.
- Expand response helpers for HTML, JSON, redirects, and error responses.

Depends on:

- Existing router, kernel, and session behavior remaining stable.

Exit criteria:

- Requests flow through middleware in a documented order.
- Invalid requests and runtime failures produce predictable responses.
- Common controller responses no longer require repetitive manual boilerplate.

## Milestone 2: Developer Experience And Safety Nets

Goal: make the framework easier to debug, safer to extend, and harder to misconfigure.

Tasks:

- Add better startup diagnostics for bad routes, missing controllers, and invalid view references.
- Add integration tests for nested routes, sessions, and view rendering.
- Add scaffold smoke tests that create a project and start it successfully.
- Add template/example parity checks so the generated app stays aligned with the reference app.

Depends on:

- Milestone 1 API decisions for middleware, validation, and error handling.

Exit criteria:

- Most common configuration mistakes fail with clear errors.
- The repository has coverage for the main integration paths that users actually run.
- Template drift is caught automatically before publish.

## Milestone 3: Release And Packaging Hardening

Goal: make the generator, template, and framework release process boring and repeatable.

Tasks:

- Add a release checklist for framework, generator, template, docs, and version bumps.
- Add or automate package version alignment between framework, template, and example app.
- Keep scaffold commands, docs, and CLI help text consistent.
- Add optional scaffold customization flags only if they do not complicate the default path.

Depends on:

- Milestone 2 confidence that scaffolding and runtime behavior are stable.

Exit criteria:

- A new published release can be produced without manual guesswork.
- The CLI and docs point to the same supported scaffold command.
- Published template output matches the intended framework version.

## Milestone 4: 1.0 Readiness Review

Goal: freeze the public API and confirm the project is ready to call 1.0.0.

Tasks:

- Review the public export surface and remove or document anything experimental.
- Document the supported routing, controller, session, and view conventions as stable.
- Decide whether middleware examples belong in the scaffolded app before 1.0.
- Verify the example app matches the generated template behavior.

Depends on:

- Completion of Milestones 1 through 3.

Exit criteria:

- The documented public API matches the shipped code.
- New apps scaffold cleanly and run without manual fixes.
- The example app and template are functionally aligned.

## Post 1.0

These are good follow-up candidates after the first stable release:

- File-based or convention-based routing experiments.
- Authentication and authorization primitives.
- Database integration or data-access helpers.
- Plugin or extension architecture.

## 1.0 Release Bar

Colonel is ready for 1.0.0 when all of the following are true:

- The documented public API is stable and covered by tests.
- New projects scaffold cleanly and start without manual fixes.
- The example app matches the template behavior.
- The docs accurately describe the shipped feature set.