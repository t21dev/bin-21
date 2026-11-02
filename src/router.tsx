import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { NotFound, GlobalError } from '@/components/route-states'

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // Native View Transitions on client-side navigation.
    defaultViewTransition: true,
    // Prefetch on hover/focus. The paste route opts out of recording a view
    // during a preload (see src/routes/$id.tsx), so this can't burn a paste.
    defaultPreload: 'intent',
    // Show skeletons after 300ms (default 1s); once shown, they stay at least
    // 500ms so a just-too-slow load doesn't flicker.
    defaultPendingMs: 300,
    defaultPendingMinMs: 500,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: GlobalError,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
