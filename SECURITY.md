# Security policy

## Status

This project is an experimental UI semantics library, **not** a security authority or production authentication layer. No released version has been qualified for production use.

## Reporting potential vulnerabilities

Please avoid publicly posting exploit details, credentials or tenant data. Where repository-level GitHub private vulnerability reporting is enabled, use that channel. If no confidential reporting channel is available, request a secure contact method without publishing sensitive technical details.

Do not share commercial UI assets, private source repositories, production logs, credentials, real account data or internal backend hostnames in a public issue.

## Trust boundaries

- Backends and trusted host applications must enforce actual authentication, tenant scoping, command rights and audit.
- Projected display values, UI permissions, route visibility and UiModuleSlot state are **not** backend authorization.
- Module code must originate from a separately vetted source; this package does not sandbox untrusted JavaScript or validate plugin signatures.
- A renderer must display source values using escaped text; never inject untrusted source content into raw HTML.
- Stale UI projections must not be reused after identity, scope or authority changes.
- Optional adapters are UI-specific and are not Core-level trust boundaries.

## Supported versions

No stable release exists. Current experimental source is supplied without a production support or patch-response commitment.
