import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, CalendarDays, CalendarRange, GraduationCap, LineChart, LogOut, Milestone } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn, fmtDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const NAV = [
  { to: '/', label: 'This week', short: 'Week', icon: CalendarDays },
  { to: '/plan', label: 'Course plan', short: 'Plan', icon: CalendarRange },
  { to: '/stages', label: 'Stages', short: 'Stages', icon: Milestone },
  { to: '/vocabulary', label: 'Vocabulary', short: 'Vocab', icon: BookOpen },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: LineChart },
]

export function AppShell() {
  const { user, logout, dataLoading, dataError, course } = useStore()
  if (!user) return null

  let content = <Outlet />
  if (dataError) content = <Notice title="Could not load data" body={dataError} />
  else if (dataLoading) content = <Notice title="Loading…" />

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700 text-white">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">IELTS Tracker</p>
            {course && <p className="text-xs text-slate-500">{fmtDate(course.startDate, 'd MMM yyyy')} – {fmtDate(course.endDate, 'd MMM yyyy')}</p>}
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
            <Badge tone={user.role === 'teacher' ? 'navy' : 'green'}>{user.role}</Badge>
          </div>
          <button onClick={logout} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-700 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">IELTS Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={user.role === 'teacher' ? 'navy' : 'green'}>{user.role}</Badge>
            <button onClick={logout} className="rounded p-1 text-slate-500" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">{content}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', isActive ? 'text-navy-700' : 'text-slate-500')
            }
          >
            <Icon className="h-5 w-5" />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Notice({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
    </div>
  )
}
