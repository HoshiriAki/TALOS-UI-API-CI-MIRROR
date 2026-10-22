import type { ProjectedCell, TableProjection } from '../contracts.js'
import { toTableViewPort } from '../presentation/table.js'
import type { TableViewPort } from '../presentation/table.js'

/** FA 6.4-only table port; base translator and TableViewPort never depend on FA. */
export interface FaTableReadColumn {
  readonly accessorKey: string
  readonly header: string
  readonly enableSorting: false
}
export interface FaTableReadRow {
  readonly __talosProjectionKey: string
  readonly [key: string]: string
}
export interface FaTableReadPort {
  readonly rowKey: '__talosProjectionKey'
  readonly columns: readonly FaTableReadColumn[]
  readonly data: readonly FaTableReadRow[]
  readonly states: readonly Readonly<Record<string, ProjectedCell['state']>>[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly readOnly: true
  readonly capabilityId: string
  readonly contextEpoch: string
}
export interface FaReadCellLabels {
  readonly nullValue: string
  readonly missing: string
  readonly unsupported: string
  readonly trueValue: string
  readonly falseValue: string
}
const chineseLabels: FaReadCellLabels = {
  nullValue: '—', missing: '未提供', unsupported: '格式不支持',
  trueValue: '是', falseValue: '否',
}
function displayCell(cell: ProjectedCell | undefined, labels: FaReadCellLabels): string {
  if (!cell || cell.state === 'missing') return labels.missing
  if (cell.state === 'null') return labels.nullValue
  if (cell.state === 'unsupported') return labels.unsupported
  if (typeof cell.value === 'boolean') return cell.value ? labels.trueValue : labels.falseValue
  return String(cell.value)
}

/**
 * Render adapter: generic TableViewPort -> verified FA v6.4 columns/data/rowKey.
 * Plain strings are for Vue text interpolation, NEVER v-html.
 */
export function tableViewToFaPort(
  view: TableViewPort,
  labels: FaReadCellLabels = chineseLabels,
): FaTableReadPort {
  if (view.contractVersion !== '0.1.0' || view.kind !== 'read-only-table') {
    throw new Error('Unsupported read-only TableViewPort')
  }
  const columns: FaTableReadColumn[] = view.columns.map(col => ({
    accessorKey: col.id, header: col.label, enableSorting: false,
  }))
  const states = view.rows.map(row => {
    const result: Record<string, ProjectedCell['state']> = Object.create(null)
    view.columns.forEach(col => { result[col.id] = row.cells[col.id]?.state ?? 'missing' })
    return result
  })
  const data: FaTableReadRow[] = view.rows.map(row => {
    const result: Record<string, string> = { __talosProjectionKey: row.key }
    view.columns.forEach(col => { result[col.id] = displayCell(row.cells[col.id], labels) })
    return result as FaTableReadRow
  })
  return {
    rowKey: '__talosProjectionKey',
    columns, data, states,
    page: view.pagination.page,
    pageSize: view.pagination.pageSize,
    total: view.pagination.total,
    readOnly: true,
    capabilityId: view.capabilityId,
    contextEpoch: view.source.contextEpoch,
  }
}

/** Backward-compatible convenience facade; FA owns no translation rules. */
export function toFaTableReadPort(
  projection: TableProjection,
  labels: FaReadCellLabels = chineseLabels,
): FaTableReadPort {
  return tableViewToFaPort(toTableViewPort(projection), labels)
}
