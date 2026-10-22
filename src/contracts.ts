/** Presentation-only types. Backend authorization and business effects never live here. */
export const FRAMEWORK_API_VERSION = '0.1.0' as const

export type ColumnKind = 'text' | 'number' | 'boolean' | 'date' | 'status'
export type CellValue = string | number | boolean

export interface ColumnDefinition {
  readonly key: string
  readonly label: string
  readonly kind: ColumnKind
}

export interface ReadCapabilityDefinition {
  readonly id: string
  readonly coreRef: string
  readonly kind: 'query'
  readonly subjectTerm: string
  readonly rowKey: string
  readonly columns: readonly ColumnDefinition[]
}

export interface PageInfo {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}

export type ProjectedCell =
  | { readonly state: 'value'; readonly value: CellValue }
  | { readonly state: 'null' }
  | { readonly state: 'missing' }
  | { readonly state: 'unsupported' }

export interface ProjectedRow {
  readonly key: string
  readonly cells: Readonly<Record<string, ProjectedCell>>
}

export interface TableProjection {
  readonly schemaVersion: typeof FRAMEWORK_API_VERSION
  readonly kind: 'table'
  readonly access: 'read-only'
  readonly capabilityId: string
  readonly subjectTerm: string
  readonly columns: readonly ColumnDefinition[]
  readonly rows: readonly ProjectedRow[]
  readonly pagination: PageInfo
  readonly source: { readonly coreRef: string; readonly contextEpoch: string }
}

export interface ReadContextFence {
  readonly contextEpoch: string
  /** Supplied by host's current authenticated workspace lifecycle. Not authority. */
  isCurrent(): boolean
}

export class TranslatorError extends Error {
  constructor(
    public readonly code: 'INVALID_SOURCE' | 'DUPLICATE_ROW_ID' | 'CONTEXT_STALE',
    message: string,
  ) {
    super(message)
    this.name = 'TranslatorError'
  }
}
