import { FRAMEWORK_API_VERSION, TranslatorError } from './contracts.js'
import type {
  ColumnDefinition, PageInfo, ProjectedCell, ProjectedRow,
  ReadCapabilityDefinition, TableProjection,
} from './contracts.js'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPageInfo(value: unknown): value is PageInfo {
  if (!record(value)) return false
  const constraints: ReadonlyArray<readonly [string, number]> = [
    ['page', 1], ['pageSize', 1], ['total', 0], ['totalPages', 0],
  ]
  return constraints.every(([key, min]) => {
    const number = value[key]
    return typeof number === 'number' && Number.isSafeInteger(number) && number >= min
  })
}

function cell(source: Record<string, unknown>, column: ColumnDefinition): ProjectedCell {
  if (!Object.hasOwn(source, column.key)) return { state: 'missing' }
  const value = source[column.key]
  if (value === null) return { state: 'null' }
  const valid = column.kind === 'number'
    ? typeof value === 'number' && Number.isFinite(value)
    : column.kind === 'boolean' ? typeof value === 'boolean' : typeof value === 'string'
  return valid ? { state: 'value', value: value as string | number | boolean } : { state: 'unsupported' }
}

/**
 * Deterministic projection for explicitly registered read capabilities.
 * No arbitrary paths, HTML, network requests, action generation or policy inference.
 */
export function projectTable(
  definition: ReadCapabilityDefinition,
  sourceRows: unknown,
  pagination: unknown,
  contextEpoch: string,
): TableProjection {
  if (definition.kind !== 'query' || !Array.isArray(sourceRows) || !isPageInfo(pagination)) {
    throw new TranslatorError('INVALID_SOURCE', 'Read capability, source rows or pagination invalid')
  }
  if (!definition.id || !definition.coreRef || !definition.rowKey || !definition.subjectTerm) {
    throw new TranslatorError('INVALID_SOURCE', 'Capability identity incomplete')
  }
  const ids = new Set<string>()
  const rows: ProjectedRow[] = sourceRows.map(source => {
    if (!record(source) || typeof source[definition.rowKey] !== 'string' || !source[definition.rowKey]) {
      throw new TranslatorError('INVALID_SOURCE', 'Row identity missing')
    }
    const key = source[definition.rowKey] as string
    if (ids.has(key)) throw new TranslatorError('DUPLICATE_ROW_ID', 'Duplicate row identity')
    ids.add(key)
    // Null prototype prevents data-key names such as __proto__ from mutating the cell dictionary.
    const cells: Record<string, ProjectedCell> = Object.create(null)
    for (const column of definition.columns) {
      if (!column.key || Object.hasOwn(cells, column.key)) {
        throw new TranslatorError('INVALID_SOURCE', 'Duplicate or empty column key')
      }
      cells[column.key] = cell(source, column)
    }
    return { key, cells }
  })
  return {
    schemaVersion: FRAMEWORK_API_VERSION,
    kind: 'table',
    access: 'read-only',
    capabilityId: definition.id,
    subjectTerm: definition.subjectTerm,
    columns: definition.columns,
    rows,
    pagination,
    source: { coreRef: definition.coreRef, contextEpoch },
  }
}
