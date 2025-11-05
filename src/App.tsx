import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom'

import { AppLayout } from '@/components/AppLayout'
import Dashboard from '@/pages/Dashboard'
import GroupDetailPage from '@/pages/GroupDetail'
import GroupsPage from '@/pages/Groups'
import ImportPage from '@/pages/Import'

function NotFound() {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">
        The page you are looking for does not exist. Use the navigation to get back on track.
      </p>
    </div>
  )
}

const router = createHashRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'import', element: <ImportPage /> },
        { path: 'groups', element: <GroupsPage /> },
        { path: 'groups/:id', element: <GroupDetailPage /> },
        { path: 'groups/:id/:tab', element: <GroupDetailPage /> },
        { path: 'dashboard', element: <Navigate to="/" replace /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
    },
  },
)

export default function App() {
  return <RouterProvider router={router} />
}
