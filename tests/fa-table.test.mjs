import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectTable, toTableViewPort, TranslatorError } from '../dist/index.js'
import { toFaTableReadPort, tableViewToFaPort } from '../dist/adapters/fantastic-admin.js'

const definition = {
  id: 'talos.orders.list',
  coreRef: 'talos',
  kind: 'query',
  subjectTerm: 'talos:Order',
  rowKey: 'id',
  columns: [
    { key: 'orderNo', label: '订单号', kind: 'text' },
    { key: 'totalPrice', label: '价格', kind: 'number' },
    { key: 'approved', label: '已批准', kind: 'boolean' },
  ],
}
const pagination = { page: 2, pageSize: 2, total: 6, totalPages: 3 }

test('FA 6.4 port maps accessorKey/header/rowKey and paging from verified table API', () => {
  const projected = projectTable(definition, [
    { id: 'order-a', orderNo: 'ORD-1', totalPrice: 0, approved: false },
    { id: 'order-b', orderNo: null, totalPrice: 'bad type', approved: true },
  ], pagination, 'scope-epoch-7')
  const fa = toFaTableReadPort(projected)
  assert.equal(fa.readOnly, true)
  assert.equal(fa.rowKey, '__talosProjectionKey')
  assert.deepEqual(fa.columns, [
    { accessorKey: 'ui_col_0', header: '订单号', enableSorting: false },
    { accessorKey: 'ui_col_1', header: '价格', enableSorting: false },
    { accessorKey: 'ui_col_2', header: '已批准', enableSorting: false },
  ])
  assert.equal(fa.data[0].__talosProjectionKey, 'order-a')
  assert.equal(fa.data[0].ui_col_1, '0')
  assert.equal(fa.data[0].ui_col_2, '否')
  assert.equal(fa.data[1].ui_col_0, '—')
  assert.equal(fa.data[1].ui_col_1, '格式不支持')
  assert.equal(fa.states[1].ui_col_0, 'null')
  assert.equal(fa.states[1].ui_col_1, 'unsupported')
  assert.equal(fa.page, 2)
  assert.equal(fa.total, 6)
  assert.equal(fa.contextEpoch, 'scope-epoch-7')
})

test('FA read adapter keeps raw business field names out of accessor paths', () => {
  const dangerousDefinition = {
    ...definition,
    columns: [{ key: '__proto__', label: '类型', kind: 'text' }],
  }
  const projected = projectTable(dangerousDefinition, [
    { id: 'safe', ['__proto__']: 'display-as-text' },
  ], { page: 1, pageSize: 1, total: 1, totalPages: 1 }, 'e')
  const fa = toFaTableReadPort(projected)
  assert.equal(fa.columns[0].accessorKey, 'ui_col_0')
  assert.equal(fa.data[0].ui_col_0, 'display-as-text')
  assert.equal(Object.hasOwn(fa.data[0], '__proto__'), false)
})

test('FA adapter rejects a projection that claims write access', () => {
  const projected = projectTable(definition, [], pagination, 'e')
  assert.throws(() => toFaTableReadPort({ ...projected, access: 'command' }),
    error => error instanceof TranslatorError && error.code === 'INVALID_SOURCE')
})


test('generic TableViewPort is independent of FA and preserves typed source facts', () => {
  const source = projectTable(definition, [
    { id: 'order', orderNo: 'ABC', totalPrice: 0, approved: false },
  ], { page: 1, pageSize: 20, total: 1, totalPages: 1 }, 'scope-1')
  const neutral = toTableViewPort(source)
  assert.deepEqual(neutral.columns[1], { id: 'ui_col_1', label: '价格', kind: 'number' })
  assert.deepEqual(neutral.rows[0].cells.ui_col_1, { state: 'value', value: 0 })
  assert.deepEqual(neutral.rows[0].cells.ui_col_2, { state: 'value', value: false })
  assert.equal(Object.keys(neutral).includes('rowKey'), false)
  assert.deepEqual(tableViewToFaPort(neutral), toFaTableReadPort(source))
})
