import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { StoreProvider, useStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Stages } from '@/pages/Stages'
import { Vocabulary } from '@/pages/Vocabulary'
import { Progress } from '@/pages/Progress'

function FullScreenMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-semibold text-slate-900">{title}</p>
        {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, authLoading, missingProfile, logout } = useStore()
  if (authLoading) return <FullScreenMessage title="Loading…" />
  if (missingProfile)
    return (
      <FullScreenMessage title="This account has no profile">
        Ask the teacher to finish setup (README step 3). <button className="text-navy-600 underline" onClick={logout}>Log out</button>
      </FullScreenMessage>
    )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  if (!isSupabaseConfigured)
    return (
      <FullScreenMessage title="Supabase is not configured">
        Copy <code>.env.example</code> to <code>.env.local</code>, fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
      </FullScreenMessage>
    )

  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="stages" element={<Stages />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="progress" element={<Progress />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
