import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UiModuleSlot, ModuleSlotError } from '../dist/runtime/module-slot.js'

test('a prebundled UI slot drains operations before replacement', async () => {
  const slot = new UiModuleSlot('talos.orders.view', 'v1')
  const release = slot.acquire()
  const draining = slot.drain()
  assert.equal(slot.state, 'draining')
  assert.throws(() => slot.acquire(), e => e instanceof ModuleSlotError && e.code === 'NOT_ACTIVE')
  assert.throws(() => slot.activate('v2'), e => e instanceof ModuleSlotError && e.code === 'NOT_DRAINED')
  release()
  await draining
  assert.equal(slot.state, 'detached')
  slot.activate('v2')
  assert.equal(slot.state, 'active')
  assert.equal(slot.version, 'v2')
})

test('lease release is idempotent and leaves unrelated module slots available', async () => {
  const a = new UiModuleSlot('a', 'one')
  const b = new UiModuleSlot('b', 'one')
  const release = a.acquire()
  const done = a.drain()
  release()
  release()
  await done
  assert.equal(a.activeLeases, 0)
  const closeB = b.acquire()
  assert.equal(b.state, 'active')
  closeB()
})

test('permission revocation preempts drain and rejects new work', async () => {
  const slot = new UiModuleSlot('private', 'v1')
  const release = slot.acquire()
  const drained = slot.drain()
  slot.revoke()
  await assert.rejects(drained, e => e instanceof ModuleSlotError && e.code === 'REVOKED')
  assert.equal(slot.state, 'revoked')
  assert.throws(() => slot.activate('v2'), e => e instanceof ModuleSlotError && e.code === 'REVOKED')
  release()
  assert.equal(slot.activeLeases, 0)
})

test('an already idle module can detach immediately', async () => {
  const slot = new UiModuleSlot('ready', 'v1')
  await slot.drain()
  assert.equal(slot.state, 'detached')
  slot.activate('v1')
  assert.equal(slot.state, 'active')
})
