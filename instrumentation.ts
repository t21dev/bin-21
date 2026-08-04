export async function register() {
  // Node.js runtime only — the janitor touches SQLite and R2.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { startJanitor } = await import('@/lib/janitor')
  startJanitor()
}
