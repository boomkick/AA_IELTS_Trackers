import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpenCheck, Headphones, PenLine, Plus, Search, type LucideIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { FULL_TEST_QUESTIONS, SECTION_QUESTIONS, weakestArea } from '@/lib/stats'
import { QUESTION_TYPES, SKILLS } from '@/lib/stages'
import { fmtDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { SkillBadge } from '@/components/ui/badge'
import type { SectionScores, Skill, TestResult, WritingTask } from '@/types'

const LISTENING = '#0284c7'
const READING = '#0d9488'
const WRITING = '#d97706'

// course order (Listening, Reading, Writing)
const SKILL_ICONS: Record<Skill, LucideIcon> = { Listening: Headphones, Reading: BookOpenCheck, Writing: PenLine }

export function Progress() {
  const { results, today, addResult } = useStore()
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

  const latestListening = latest('Listening')
  const latestReading = latest('Reading')
  const weakListening = latestListening && weakestArea(latestListening)
  const weakReading = latestReading && weakestArea(latestReading)

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
        subtitle="Full test results and weak spots"
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add score</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SKILLS.map((skill) => {
          const result = latest(skill)
          return <StatCard key={skill} label={skill} value={result ? result.band.toFixed(1) : '—'} hint={delta(skill)} icon={SKILL_ICONS[skill]} />
        })}
        <StatCard
          label="Weakest area"
          value={weakListening || weakReading ? <span className="block space-y-0.5 text-sm">{weakListening && <span className="block">L: {weakListening}</span>}{weakReading && <span className="block">R: {weakReading}</span>}</span> : '—'}
          hint="from the latest Full tests"
          icon={Search}
        />
      </div>

      <Card className="mt-6">
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
                <Line type="monotone" dataKey="Writing" stroke={WRITING} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <SkillBadge skill={r.skill} />
                    {r.writingTask && <span className="ml-1.5 text-xs text-slate-500">Task {r.writingTask}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{r.correct !== undefined && r.total !== undefined ? `${r.correct}/${r.total}` : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{r.band.toFixed(1)}</td>
                  <td className="px-5 py-2.5 text-slate-500">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {formOpen && <ScoreForm onClose={() => setFormOpen(false)} onSave={addResult} today={today} />}
    </>
  )
}

const SECTIONS = [0, 1, 2, 3] as const

/** Wrong answers per Question type, without blanks or zeros; nothing at all when none were wrong. */
function wrongAnswers(entries: Record<string, string>): TestResult['wrongByType'] {
  const wrong = Object.entries(entries).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])
  return wrong.length > 0 ? Object.fromEntries(wrong) : undefined
}

/** A whole number in [min, max]; blank is not one. */
const inRange = (v: string, min: number, max: number) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max

function ScoreForm({ onClose, onSave, today }: { onClose: () => void; onSave: (r: Omit<TestResult, 'id'>) => void; today: string }) {
  const [f, setF] = useState({ date: today, skill: 'Listening' as Skill, band: '', notes: '', correct: '', writingTask: 1 as WritingTask })
  const [sections, setSections] = useState(['', '', '', ''])
  const [wrong, setWrong] = useState<Record<string, string>>({})

  // band in steps of 0.5: twice the band is a whole number from 0 to 18
  const bandOk = f.band.trim() !== '' && inRange(String(Number(f.band) * 2), 0, 18)
  const sectionsOk = sections.every((s) => inRange(s, 0, SECTION_QUESTIONS))
  const sectionTotal = sections.reduce((sum, s) => sum + Number(s), 0)

  // one place for the per-skill fields: whether they're valid, and what they save
  const detail: Record<Skill, { ok: boolean; fields: () => Partial<TestResult> }> = {
    Listening: {
      ok: sectionsOk,
      fields: () => ({ sectionCorrect: sections.map(Number) as SectionScores, correct: sectionTotal, total: FULL_TEST_QUESTIONS }),
    },
    Reading: {
      ok: inRange(f.correct, 0, FULL_TEST_QUESTIONS) && Object.values(wrong).every((v) => v.trim() === '' || inRange(v, 0, FULL_TEST_QUESTIONS)),
      // blanks and zeros are not saved
      fields: () => ({
        correct: Number(f.correct), total: FULL_TEST_QUESTIONS,
        wrongByType: wrongAnswers(wrong),
      }),
    },
    Writing: { ok: true, fields: () => ({ writingTask: f.writingTask }) },
  }
  const valid = !!f.date && bandOk && detail[f.skill].ok

  function submit() {
    if (!valid) return
    onSave({ date: f.date, skill: f.skill, band: Number(f.band), notes: f.notes.trim() || undefined, ...detail[f.skill].fields() })
    onClose()
  }

  return (
    <Dialog
      open
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
        <div><Label htmlFor="score-date">Date</Label><Input id="score-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div>
          <Label htmlFor="score-skill">Skill</Label>
          <Select id="score-skill" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value as Skill })}>
            {SKILLS.map((skill) => <option key={skill}>{skill}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="score-band">Band</Label><Input id="score-band" type="number" min={0} max={9} step={0.5} value={f.band} onChange={(e) => setF({ ...f, band: e.target.value })} /></div>

        {f.skill === 'Reading' && (
          <div><Label htmlFor="score-correct">Correct (of {FULL_TEST_QUESTIONS})</Label><Input id="score-correct" type="number" min={0} max={FULL_TEST_QUESTIONS} value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} /></div>
        )}
        {f.skill === 'Writing' && (
          <div>
            <Label htmlFor="score-task">Task</Label>
            <Select id="score-task" value={f.writingTask} onChange={(e) => setF({ ...f, writingTask: Number(e.target.value) as WritingTask })}>
              <option value={1}>Task 1</option>
              <option value={2}>Task 2</option>
            </Select>
          </div>
        )}
      </div>

      {f.skill === 'Listening' && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">
            Correct per Section (0–{SECTION_QUESTIONS} each) · total {sectionsOk ? sectionTotal : '…'}/{FULL_TEST_QUESTIONS}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SECTIONS.map((i) => (
              <div key={i}>
                <Label htmlFor={`score-s${i + 1}`}>Section {i + 1}</Label>
                <Input id={`score-s${i + 1}`} type="number" min={0} max={SECTION_QUESTIONS} value={sections[i]} onChange={(e) => setSections(sections.map((s, j) => (j === i ? e.target.value : s)))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {f.skill === 'Reading' && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Wrong answers per Question type (leave blank if none)</p>
          <div className="space-y-1.5">
            {QUESTION_TYPES.map((q) => (
              <div key={q} className="flex items-center gap-2">
                <label htmlFor={`wrong-${q}`} className="flex-1 text-sm text-slate-600">{q}</label>
                <Input id={`wrong-${q}`} type="number" min={0} max={FULL_TEST_QUESTIONS} className="w-20" value={wrong[q] ?? ''} onChange={(e) => setWrong({ ...wrong, [q]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div><Label htmlFor="score-notes">Notes</Label><Textarea id="score-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="min-h-16" /></div>
    </Dialog>
  )
}
