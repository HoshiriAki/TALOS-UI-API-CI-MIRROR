# TALOS UI Framework API — CI Mirror

This is a **temporary, source-only qualification mirror**, created to run GitHub Actions with standard public-repository runners. It is not an official release or an open-source project.

**Copyright: all rights reserved. No license to use, modify, distribute, or commercialize the code is offered by this repository.** Public access remains subject to applicable law and GitHub platform terms.

## What is tested

The exported source subset includes deterministic read-only semantic projection, a framework-neutral table view contract, an optional structural Fantastic-Admin adapter, an experimental UI module-slot lifecycle, and synthetic tests.

A successful workflow verifies only the source and tests in this mirror's exact commit. It does **not** qualify the private application, real TALOS authentication, tenant isolation, backend business operations, or end-to-end Fantastic-Admin behavior.

## CI controls

- Standard GitHub-hosted `ubuntu-latest` only; no larger paid runners.
- `GITHUB_TOKEN` has `contents: read` only.
- No private-repository checkout, credentials, environment secrets, commercial FA source, or Core operational data.
- No npm publication and `package.json` remains `private: true`.
- A clean root commit contains only the reviewed source snapshot; internal Git history and planning documents are excluded.

The mirror may be removed after its qualification purpose is complete; material exposed publicly cannot be guaranteed to become private again.

## Development

Requires Node.js 22 and pnpm 10.

```bash
corepack enable
pnpm install --no-frozen-lockfile --ignore-scripts
pnpm typecheck
pnpm test
```

Source-level contracts are experimental and may change. Please do not submit issues with private repository information, credentials, real tenant data, or security-sensitive material.
