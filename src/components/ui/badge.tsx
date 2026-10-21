import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { Skill, TaskType } from '@/types'

const tones = {
  navy: 'bg-navy-100 text-navy-800',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-700',
  sky: 'bg-sky-100 text-sky-800',
  teal: 'bg-teal-100 text-teal-800',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones
}

export function Badge({ tone = 'slate', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', tones[tone], className)}
      {...props}
    />
  )
}

const typeLabel: Record<TaskType, string> = {
  teacher_session: 'Teacher-led',
  self_study: 'Self-study',
  homework: 'Homework',
}
const typeTone: Record<TaskType, keyof typeof tones> = {
  teacher_session: 'navy',
  self_study: 'slate',
  homework: 'amber',
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return <Badge tone={typeTone[type]}>{typeLabel[type]}</Badge>
}

const skillTone: Record<Skill, keyof typeof tones> = {
  Listening: 'sky',
  Reading: 'teal',
  Writing: 'amber',
}

export function SkillBadge({ skill }: { skill: Skill }) {
  return <Badge tone={skillTone[skill]}>{skill}</Badge>
}
