import { TranslatorError } from './contracts.js'
import type { PageInfo, ReadCapabilityDefinition, ReadContextFence, TableProjection } from './contracts.js'
import { projectTable } from './translator.js'

export interface ReadPage {
  readonly rows: unknown
  readonly pagination: PageInfo | unknown
}

/** Supplied by a trusted host-side adapter. The core never fetches credentials. */
export type ReadSource = (signal?: AbortSignal) => Promise<ReadPage>

/** This is only a UI publication fence, not authentication or business authority. */
export async function readTable(
  definition: ReadCapabilityDefinition,
  source: ReadSource,
  fence: ReadContextFence,
  signal?: AbortSignal,
): Promise<TableProjection> {
  if (!fence.isCurrent()) throw new TranslatorError('CONTEXT_STALE', 'Context changed before read')
  const raw = await source(signal)
  if (!fence.isCurrent()) throw new TranslatorError('CONTEXT_STALE', 'Context changed before publish')
  return projectTable(definition, raw.rows, raw.pagination, fence.contextEpoch)
}
