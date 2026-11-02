import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { adminLogout, getAdminState } from '@/server/actions/admin.actions'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminSkeleton, Dashboard } from '@/components/admin/dashboard'

export const Route = createFileRoute('/admin')({
  // The request middleware already 404s /admin when ADMIN_TOKEN is unset; this
  // covers client-side navigation, which never hits that path as a document.
  loader: async () => {
    const state = await getAdminState()
    if (!state.enabled) throw notFound()
    return state
  },
  // Analytics are read live; never reuse a cached result.
  staleTime: 0,
  gcTime: 0,
  // Analytics must never be indexed.
  head: () => ({
    meta: [{ title: 'Admin - Bin 21' }, { name: 'robots', content: 'noindex, nofollow' }],
  }),
  pendingComponent: () => (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminSkeleton />
    </div>
  ),
  component: AdminPage,
})

function AdminPage() {
  const state = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {state.enabled && state.authenticated ? (
        <Dashboard
          stats={state.stats}
          onSignOut={async () => {
            await adminLogout()
            await router.invalidate()
          }}
        />
      ) : (
        <AdminLogin />
      )}
    </div>
  )
}
