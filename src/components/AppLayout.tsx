import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { Toaster } from 'sonner'

import { useAppStore } from '@/store'

const navigation = [
  { name: 'Dashboard', to: '/' },
  { name: 'Groups', to: '/groups' },
  { name: 'Import', to: '/import' },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { ready, initializing, error, initialize } = useAppStore((state) => ({
    ready: state.ready,
    initializing: state.initializing,
    error: state.error,
    initialize: state.initialize,
  }))

  const [offline, setOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false))

  useEffect(() => {
    if (!ready && !initializing) {
      initialize().catch((err) => console.error('Failed to initialize app', err))
    }
  }, [ready, initializing, initialize])

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Transition.Root show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/70" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-lg font-semibold tracking-tight">Gradebook</span>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="sr-only">Close navigation</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1 px-4 pb-6">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        clsx(
                          'block rounded-xl px-3 py-2 text-base font-medium',
                          isActive
                            ? 'bg-sky-500/10 text-sky-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">Gradebook</span>
        </div>
        <nav className="mt-8 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-sky-500/10 text-sky-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            onClick={() => setMobileOpen(true)}
          >
            <span className="sr-only">Open navigation</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold tracking-tight">Gradebook</span>
          <div className="h-8 w-8" aria-hidden />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {offline ? (
              <div className="mb-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                You are offline. Changes will sync locally and exports will use cached data.
              </div>
            ) : null}
            {!ready ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" aria-hidden />
                <p className="text-sm font-medium text-slate-600">
                  {initializing ? 'Loading your gradebook data…' : 'Preparing workspace…'}
                </p>
                {error ? <p className="text-xs text-rose-500">{error}</p> : null}
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors toastOptions={{ duration: 3500 }} />
    </div>
  )
}
