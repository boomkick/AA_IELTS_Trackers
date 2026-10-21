import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpenCheck, Headphones, ListChecks, Plus, Target } from 'lucide-react'
import { useStore } from '@/lib/store'
import { completionRate, weekOf } from '@/lib/stats'
import { fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { SkillBadge } from '@/components/ui/badge'
import type { Skill, TestResult } from '@/types'

const LISTENING = '#0284c7'
const READING = '#0d9488'

export function Progress() {
  const { user, weeks, tasks, completions, results, today, addResult } = useStore()
  const isStudent = user?.role === 'student'
  const [formOpen, setFormOpen] = useState(false)

  const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date))
  const latest = (skill: Skill) => [...sorted].reverse().find((r) => r.skill === skill)
  const first = (skill: Skill) => sorted.find((r) => r.skill === skill)

  const scoreData = Object.values(
    sorted.reduce<Record<string, { date: string } & Partial<Record<Skill, number>>>>((acc, r) => {
      acc[r.date] ??= { date: fmtDate(r.date, 'd MMM') }
      acc[r.date][r.skill] = r.band
      return acc
    }, {}),
  )

  const currentWeek = weekOf(weeks, today)?.number ?? 0
  const weeklyData = weeks
    .filter((w) => w.number <= currentWeek)
    .map((w) => ({ week: `W${w.number}`, rate: completionRate(tasks.filter((t) => t.weekNumber === w.number), completions) }))

  const dueSoFar = tasks.filter((t) => (t.dueDate ?? t.date) < today)
  const L = latest('Listening')
  const R = latest('Reading')

  const delta = (skill: Skill) => {
    const a = first(skill)
    const b = latest(skill)
    if (!a || !b || a === b) return 'first result'
    const d = b.band - a.band
    return `${d >= 0 ? '+' : ''}${d.toFixed(1)} since ${fmtDate(a.date, 'd MMM')}`
  }

  return (
    <>
      <PageHeader
        title="Progress"
        subtitle="Test scores and task completion"
        actions={isStudent && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add score</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Listening" value={L ? L.band.toFixed(1) : '—'} hint={delta('Listening')} icon={Headphones} />
        <StatCard label="Reading" value={R ? R.band.toFixed(1) : '—'} hint={delta('Reading')} icon={BookOpenCheck} />
        <StatCard label="Completion" value={`${completionRate(dueSoFar, completions)}%`} hint="of tasks due so far" icon={ListChecks} />
        <StatCard label="Target" value="6.5" hint="Listening & Reading" icon={Target} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Band score history</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Listening" stroke={LISTENING} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Reading" stroke={READING} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Weekly task completion</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Completed']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>Score history</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-3 py-2.5">Skill</th>
                <th className="px-3 py-2.5 text-right">Correct</th>
                <th className="px-3 py-2.5 text-right">Band</th>
                <th className="px-5 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-5 py-2.5 text-slate-700">{fmtDate(r.date, 'EEE d MMM')}</td>
                  <td className="px-3 py-2.5"><SkillBadge skill={r.skill} /></td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{r.correct}/{r.total}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{r.band.toFixed(1)}</td>
                  <td className="px-5 py-2.5 text-slate-500">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ScoreForm open={formOpen} onClose={() => setFormOpen(false)} onSave={addResult} today={today} />
    </>
  )
}

function ScoreForm({ open, onClose, onSave, today }: { open: boolean; onClose: () => void; onSave: (r: Omit<TestResult, 'id'>) => void; today: string }) {
  const [f, setF] = useState({ date: today, skill: 'Listening' as Skill, correct: '', band: '', notes: '' })
  const valid = Number(f.band) >= 0 && Number(f.band) <= 9 && f.band !== '' && f.correct !== ''

  function submit() {
    if (!valid) return
    onSave({ date: f.date, skill: f.skill, correct: Number(f.correct), total: 40, band: Number(f.band), notes: f.notes || undefined })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add test score"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div>
          <Label>Skill</Label>
          <Select value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value as Skill })}>
            <option>Listening</option>
            <option>Reading</option>
          </Select>
        </div>
        <div><Label>Correct (of 40)</Label><Input type="number" min={0} max={40} value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} /></div>
        <div><Label>Band</Label><Input type="number" min={0} max={9} step={0.5} value={f.band} onChange={(e) => setF({ ...f, band: e.target.value })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="min-h-16" /></div>
    </Dialog>
  )
}
