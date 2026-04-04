# Release Checklist

Use this checklist before publishing any Colonel release.

## 1. Validate Code And Scaffolding

- `bun run tsc --noEmit`
- `bun run test:framework`
- `bun run test:parity`
- `bun run test:smoke`
- `bun run test:release`

## 2. Verify Version Alignment

- Confirm `packages/framework/package.json` has the intended release version.
- Confirm `packages/create-colonel/template/package.json` depends on `@coloneldev/framework` as `^<framework-version>`.
- Confirm `packages/create-colonel/package.json` version is bumped when generator/template behavior changes.

## 3. Verify Scaffold Command Consistency

- Ensure docs and CLI usage text consistently use `bunx create-colonel my-app`.
- Ensure no legacy commands are present in user-facing docs.

## 4. Update Documentation

- Update user-facing docs for any runtime, routing, middleware, or template changes.
- Verify docs navigation links include any new pages.
- Confirm examples in docs match current framework API.

## 5. Publish Sequence

1. Publish `@coloneldev/framework`.
2. Update template dependency range if needed.
3. Publish `create-colonel`.
4. Verify scaffold output with `bunx create-colonel my-app`.
5. Create and push annotated tag (for example `v1.0.0`) on the publish commit.

If using automated publish on GitHub Release:

- Add repository secret `NPM_TOKEN` with npm publish permissions.
- Ensure package versions match the release tag (for example tag `v1.0.2` and package versions `1.0.2`).
- Publish a GitHub Release from the version tag to trigger workflow `.github/workflows/publish-on-release.yml`.

## 6. Post-Publish Validation

- Generate a fresh app with published packages.
- Run `bun run start` and verify `/health` returns 200.
- Verify docs links and starter commands still work as documented.

## 7. Provenance And Notes

- Confirm CI is green on the release commit and tag.
- Publish release notes and changelog entry for the released version.