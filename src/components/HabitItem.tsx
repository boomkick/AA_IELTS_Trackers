import type { ReactNode } from 'react'
import { Flame } from 'lucide-react'
import { useStore } from '@/lib/store'
import { isDaily, rhythmLabel, streak, weekCount } from '@/lib/habits'
import { Checkbox } from '@/components/ui/checkbox'
import type { Habit } from '@/types'

/** One Habit: today's tick (student only), its rhythm, this week's count and, for daily Habits, the streak. */
export function HabitItem({ habit, actions }: { habit: Habit; actions?: ReactNode }) {
  const { user, habitTicks, today, setHabitTicked } = useStore()
  const ticks = habitTicks[habit.id] ?? []
  return (
    <li className="flex gap-2.5 py-2">
      <div className="pt-0.5">
        <Checkbox
          checked={ticks.includes(today)}
          disabled={user?.role === 'teacher'}
          onChange={(d) => setHabitTicked(habit.id, d)}
          label={`Mark "${habit.title}" as done today`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{habit.title}</p>
        {habit.description && <p className="mt-0.5 text-xs text-slate-500">{habit.description}</p>}
        <p className="mt-0.5 text-xs text-slate-500">
          {rhythmLabel(habit.timesPerWeek)} · {weekCount(ticks, today)} this week
          {isDaily(habit.timesPerWeek) && <> · <Flame className="inline h-3 w-3 text-orange-500" /> {streak(ticks, today)} day streak</>}
        </p>
      </div>
      {actions && <div className="flex shrink-0 gap-0.5">{actions}</div>}
    </li>
  )
}
