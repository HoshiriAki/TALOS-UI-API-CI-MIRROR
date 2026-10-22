import { TranslatorError } from '../contracts.js'
import type { ColumnKind, PageInfo, ProjectedCell, TableProjection } from '../contracts.js'

/**
 * A renderer-agnostic, lossless presentation boundary.
 * No FA/Vue/TanStack/Element dependency and no string formatting.
 */
export interface TableViewColumn {
  readonly id: string
  readonly label: string
  readonly kind: ColumnKind
}
export interface TableViewRow {
  readonly key: string
  readonly cells: Readonly<Record<string, ProjectedCell>>
}
export interface TableViewPort {
  readonly contractVersion: '0.1.0'
  readonly kind: 'read-only-table'
  readonly capabilityId: string
  readonly subjectTerm: string
  readonly columns: readonly TableViewColumn[]
  readonly rows: readonly TableViewRow[]
  readonly pagination: PageInfo
  readonly source: { readonly coreRef: string; readonly contextEpoch: string }
}

/** Index-based presentation identifiers avoid unsafe dots and magic field names. */
export function toTableViewPort(table: TableProjection): TableViewPort {
  if (table.schemaVersion !== '0.1.0' || table.kind !== 'table' || table.access !== 'read-only') {
    throw new TranslatorError('INVALID_SOURCE', 'Unsupported presentation projection contract')
  }
  if (new Set(table.rows.map(row => row.key)).size !== table.rows.length) {
    throw new TranslatorError('DUPLICATE_ROW_ID', 'Ambiguous row identities')
  }

  const columns = table.columns.map((column, index): TableViewColumn => ({
    id: 'ui_col_' + index,
    label: column.label,
    kind: column.kind,
  }))
  const rows = table.rows.map((row): TableViewRow => {
    const cells: Record<string, ProjectedCell> = Object.create(null)
    table.columns.forEach((sourceColumn, index) => {
      cells['ui_col_' + index] = row.cells[sourceColumn.key] ?? { state: 'missing' }
    })
    return { key: row.key, cells }
  })
  return {
    contractVersion: '0.1.0',
    kind: 'read-only-table',
    capabilityId: table.capabilityId,
    subjectTerm: table.subjectTerm,
    columns,
    rows,
    pagination: table.pagination,
    source: table.source,
  }
}
