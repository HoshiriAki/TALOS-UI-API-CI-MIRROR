# API Contracts — experimental 0.1

The following documents the checked-in TypeScript API; it is not a production-stable ABI.

## ReadCapabilityDefinition

An explicit, read-only display mapping. It includes an ID, coreRef, subjectTerm, a stable rowKey and column definitions. Registration does **not** grant an actual backend permission.

## projectTable(definition, rawRows, pagination, contextEpoch)

Deterministically maps a backend result into a TableProjection. For every declared column it preserves:

| State | Meaning |
|---|---|
| value | A declared type-compatible value, including numeric 0 and boolean false |
| null | Explicit null supplied by the source |
| missing | Source did not supply this field |
| unsupported | Source value was incompatible with the declared presentation type |

The translator rejects malformed pagination, absent stable row IDs and duplicate IDs instead of inventing placeholder business records. Undeclared source properties are not projected. **Projection is not a substitute for server-side data filtering or redaction.**

## readTable(definition, source, fence, signal?)

Calls an injected, host-owned read source. Before the request and after it resolves, a caller-supplied ReadContextFence determines whether the UI context is still current. Backend authentication and tenant authorization are independent requirements. Cancellation and fencing limit publication of stale UI data, not backend effects.

## toTableViewPort(table)

Converts a TableProjection to a renderer-neutral typed table view. Preserves row identity, column display labels and types, pagination, source generation and cell states. It has no framework-specific accessorKey or component-name dependency.

## Optional Fantastic-Admin adapter

The optional adapters/fantastic-admin import exposes toFaTableReadPort and tableViewToFaPort. These map the neutral projection to structural FA table columns, rows and pagination while retaining cell states separately. They do **not** import licensed UI-kit source files.

## UiModuleSlot (experimental)

Tracks host-observed UI leases and transitions between active, draining, detached and revoked. Releasing the last lease allows an idle slot to detach; revocation stops new UI admissions. The host must separately implement trusted module admission, route/menu/cache cleanup, version verification and recovery.

**Not guaranteed:** cancellation, completion, rollback, or replacement of Core business commands or running execution streams.

## Stability

Contract version is experimental. Until a public release is qualified, API, exports and types may change without a compatibility guarantee.
