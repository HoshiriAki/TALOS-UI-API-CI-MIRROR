# Contributing

This repository is being prepared for possible public availability. Contributions are not yet open for acceptance under an agreed license. Do not submit third-party or commercially licensed component code.

When contributions are enabled:

- Keep the core independent of UI frameworks and commercial vendor components.
- Preserve explicit null, missing, unsupported, zero and false semantics.
- Add deterministic unit tests for schema, identity and stale-context boundaries.
- Treat business commands, tenant authority and audit as backend-owned concerns.
- Put renderer-specific integrations in optional adapters; avoid importing their dependencies into the core.
- Avoid exposing real deployment endpoints, account data or private repository links in commits, CI logs or test fixtures.

Check package toolchain versions and run typecheck, build and tests on the exact reviewed revision. No external CLA or redistribution terms have been established yet.
