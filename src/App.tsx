import { Suspense, useEffect } from 'react'
import { Link, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import DashboardPage from '@/pages/Dashboard'
import ImportPage from '@/pages/Import'
import GroupsPage from '@/pages/Groups'
import GroupDetailPage from '@/pages/GroupDetail'
import { useAppStore } from '@/store'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'groups/:id', element: <GroupDetailPage /> },
    ],
  },
])

function AppLayout() {
  const init = useAppStore((state) => state.init)
  const hydrated = useAppStore((state) => state.hydrated)
  const loading = useAppStore((state) => state.loading)

  useEffect(() => {
    if (!hydrated) void init()
  }, [hydrated, init])

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            Skylark
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-brand-600">
              Dashboard
            </Link>
            <Link to="/groups" className="hover:text-brand-600">
              Groups
            </Link>
            <Link to="/import" className="hover:text-brand-600">
              Import
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
        {loading && !hydrated ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading data…
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500">
          <span>Skylark Gradebook · Offline-first</span>
          <span>Phase 1 – local data only</span>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}

export default App
