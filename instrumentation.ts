export async function register() {
  // Node.js runtime only — these touch SQLite and R2.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // Open the DB and run migrations now, so a fresh volume has its schema as
  // soon as the server is up rather than on the first paste view.
  const { initDb } = await import('@/lib/db')
  initDb()

  const { startJanitor } = await import('@/lib/janitor')
  startJanitor()
}
