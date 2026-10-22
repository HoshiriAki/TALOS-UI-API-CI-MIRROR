import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectTable, readTable, TranslatorError } from '../dist/index.js'

const def = {
  id: 'talos.orders.list',
  coreRef: 'talos',
  kind: 'query',
  subjectTerm: 'talos:Order',
  rowKey: 'id',
  columns: [
    { key: 'price', label: '价格', kind: 'number' },
    { key: 'status', label: '状态', kind: 'status' },
    { key: 'flag', label: '布尔标志', kind: 'boolean' },
  ],
}
const pagination = { page: 1, pageSize: 30, total: 4, totalPages: 1 }

test('preserves missing, null, numeric zero and invalid types without coercion', () => {
  const p = projectTable(def, [
    { id: '1', price: 0, status: 'draft', flag: false, secret: 'do-not-project' },
    { id: '2', price: null },
    { id: '3' },
    { id: '4', price: 'invalid' },
  ], pagination, 'epoch-one')
  assert.deepEqual(p.rows.map(r => r.cells.price.state), ['value', 'null', 'missing', 'unsupported'])
  assert.deepEqual(p.rows[0].cells.price, { state: 'value', value: 0 })
  assert.deepEqual(p.rows[0].cells.flag, { state: 'value', value: false })
  assert.equal(Object.hasOwn(p.rows[0].cells, 'secret'), false)
  assert.equal(p.access, 'read-only')
  assert.equal(p.source.contextEpoch, 'epoch-one')
})

test('rejects ambiguous row identities and malformed pagination', () => {
  assert.throws(() => projectTable(def, [{ id: 'x' }, { id: 'x' }], pagination, 'e'),
    e => e instanceof TranslatorError && e.code === 'DUPLICATE_ROW_ID')
  assert.throws(() => projectTable(def, [{}], pagination, 'e'),
    e => e instanceof TranslatorError && e.code === 'INVALID_SOURCE')
  assert.throws(() => projectTable(def, [], { ...pagination, page: 0 }, 'e'),
    e => e instanceof TranslatorError && e.code === 'INVALID_SOURCE')
})

test('drops late provider response when authenticated UI context changes', async () => {
  let finish
  let live = true
  const source = () => new Promise(resolve => { finish = resolve })
  const pending = readTable(def, source, { contextEpoch: 'old', isCurrent: () => live })
  live = false
  finish({ rows: [{ id: 'old' }], pagination })
  await assert.rejects(pending, e => e instanceof TranslatorError && e.code === 'CONTEXT_STALE')
})

test('allows a valid read only through explicit host port', async () => {
  let count = 0
  const source = async () => { count += 1; return { rows: [{ id: 'ok', price: 17 }], pagination } }
  const projected = await readTable(def, source, { contextEpoch: 'new', isCurrent: () => true })
  assert.equal(count, 1)
  assert.equal(projected.rows[0].key, 'ok')
  assert.equal(projected.rows[0].cells.price.value, 17)
})
