import { createServerEntry, createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { initDb } from '@/lib/db'
import { startJanitor } from '@/lib/janitor'

// Replaces Next's instrumentation.ts: open the DB (running migrations) and
// start the expired-paste janitor at boot, not on the first request, so a
// fresh volume has its schema as soon as the server is up.
initDb()
startJanitor()

const fetch = createStartHandler(defaultStreamHandler)

export default createServerEntry({ fetch })
