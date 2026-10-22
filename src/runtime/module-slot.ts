/**
 * Experimental renderer-neutral lifecycle coordinator for PRE-BUNDLED,
 * independently admitted UI modules. It never downloads/evaluates code, decides
 * backend authorization, or controls a TALOS/MAXWELL business execution Stream.
 */
export type ModuleSlotState = 'active' | 'draining' | 'detached' | 'revoked'

export class ModuleSlotError extends Error {
  constructor(readonly code: 'NOT_ACTIVE' | 'NOT_DRAINED' | 'REVOKED', message: string) {
    super(message)
    this.name = 'ModuleSlotError'
  }
}

/**
 * A lease covers only host-observed UI activity, not a Core business command.
 * Authorization must be checked independently at the backend on each operation.
 */
export class UiModuleSlot {
  private currentState: ModuleSlotState = 'active'
  private activeCount = 0
  private releaseDrain: (() => void) | null = null
  private pendingDrain: Promise<void> | null = null

  constructor(readonly moduleId: string, private currentVersion: string) {
    if (!moduleId || !currentVersion) throw new Error('Module ID/version must be nonempty')
  }

  get state(): ModuleSlotState { return this.currentState }
  get version(): string { return this.currentVersion }
  get activeLeases(): number { return this.activeCount }

  /**
   * Rejects newly admitted UI operations when a replacement is requested.
   * Release is idempotent to survive component unmount/error paths.
   */
  acquire(): () => void {
    if (this.currentState !== 'active') {
      throw new ModuleSlotError('NOT_ACTIVE', 'UI module no longer accepts new operations')
    }
    this.activeCount += 1
    let released = false
    return () => {
      if (released) return
      released = true
      this.activeCount -= 1
      if (this.activeCount === 0 && this.releaseDrain) {
        const notify = this.releaseDrain
        this.releaseDrain = null
        notify()
      }
    }
  }

  /** Transition to draining, then detach only after tracked UI operations finish. */
  drain(): Promise<void> {
    if (this.currentState === 'revoked') {
      return Promise.reject(new ModuleSlotError('REVOKED', 'Scope revoked'))
    }
    if (this.currentState === 'detached') return Promise.resolve()
    if (this.pendingDrain) return this.pendingDrain
    this.currentState = 'draining'
    if (this.activeCount === 0) {
      this.currentState = 'detached'
      return Promise.resolve()
    }
    const task = new Promise<void>((resolve, reject) => {
      this.releaseDrain = () => {
        if (this.currentState === 'revoked') {
          reject(new ModuleSlotError('REVOKED', 'Scope revoked during drain'))
        }
        else {
          this.currentState = 'detached'
          resolve()
        }
      }
    })
    this.pendingDrain = task
    void task.finally(() => { if (this.pendingDrain === task) this.pendingDrain = null }).catch(() => {})
    return task
  }

  /**
   * The host must FIRST remove old routes, subscriptions, tabs and stale data,
   * and verify new module admission/version compatibility. A successful call
   * here only changes this local UI slot's state.
   */
  activate(version: string): void {
    if (this.currentState === 'revoked') {
      throw new ModuleSlotError('REVOKED', 'Revoked module cannot be remounted')
    }
    if (this.currentState !== 'detached' || this.activeCount !== 0 || !version) {
      throw new ModuleSlotError('NOT_DRAINED', 'UI slot must be detached before activation')
    }
    this.currentVersion = version
    this.currentState = 'active'
  }

  /**
   * Local presentation revocation has priority over outstanding UI leases.
   * It does NOT cancel or compensate business actions already accepted by Core.
   */
  revoke(): void {
    if (this.currentState === 'revoked') return
    this.currentState = 'revoked'
    if (this.releaseDrain) {
      const notify = this.releaseDrain
      this.releaseDrain = null
      notify()
    }
  }
}
