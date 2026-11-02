/**
 * A small LRU cache bounded by total *bytes*, not entry count. A single 2MB
 * paste and a hundred one-liners cost what they actually cost, so the budget
 * is a real memory ceiling (the reason this app exists in its current form is
 * to keep RSS low on a single small instance).
 *
 * Map preserves insertion order; re-inserting on read moves an entry to the
 * most-recently-used end, and eviction pops from the front.
 */
export class ByteLRU {
  private map = new Map<string, string>()
  private used = 0

  constructor(
    private readonly maxBytes: number,
    private readonly maxEntryBytes = Math.floor(maxBytes / 4)
  ) {}

  /** UTF-16 storage: ~2 bytes per code unit in V8 for non-Latin-1 strings. */
  private static size(s: string): number {
    return s.length * 2
  }

  get(key: string): string | undefined {
    const value = this.map.get(key)
    if (value === undefined) return undefined
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: string, value: string): void {
    const size = ByteLRU.size(value)
    if (size > this.maxEntryBytes) return // too big to be worth keeping

    this.delete(key)
    this.map.set(key, value)
    this.used += size

    while (this.used > this.maxBytes) {
      const oldest = this.map.keys().next().value
      if (oldest === undefined) break
      this.delete(oldest)
    }
  }

  delete(key: string): void {
    const prev = this.map.get(key)
    if (prev === undefined) return
    this.map.delete(key)
    this.used -= ByteLRU.size(prev)
  }

  /** Removes every entry whose key starts with `prefix`. */
  deletePrefix(prefix: string): void {
    for (const key of [...this.map.keys()]) {
      if (key.startsWith(prefix)) this.delete(key)
    }
  }

  get bytes(): number {
    return this.used
  }
}
