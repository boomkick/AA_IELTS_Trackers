import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { useStore } from '@/lib/store'
import { SKILLS } from '@/lib/stages'
import { MISSION_TYPE_LABEL } from '@/lib/weeks'
import type { MissionDraft, MissionType, Skill } from '@/types'

interface MissionFormProps {
  open: boolean
  onClose: () => void
  /** The Mission to edit, or null to add one on `defaultDate`. */
  initial: MissionDraft | null
  defaultDate: string
}

const empty = (date: string): MissionDraft => ({ date, durationMin: 60, type: 'self_study', skill: 'Listening', title: '', description: '' })

/** Teacher only: add or edit a Mission. Its Week comes from its date. */
export function MissionForm({ open, onClose, initial, defaultDate }: MissionFormProps) {
  const { course, upsertMission } = useStore()
  const [form, setForm] = useState<MissionDraft>(initial ?? empty(defaultDate))

  useEffect(() => {
    if (open) setForm(initial ?? empty(defaultDate))
  }, [open, initial, defaultDate])

  const set = <K extends keyof MissionDraft>(key: K, value: MissionDraft[K]) => setForm((f) => ({ ...f, [key]: value }))

  function setType(type: MissionType) {
    setForm((f) => ({
      ...f,
      type,
      ...(type === 'teacher_session' ? { startTime: '20:00', endTime: '21:30', durationMin: 90 } : { startTime: undefined, endTime: undefined }),
      dueDate: type === 'homework' ? (f.dueDate ?? f.date) : undefined,
    }))
  }

  function submit() {
    if (!form.title.trim()) return
    upsertMission(form)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Mission' : 'Add Mission'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Section 2 map labelling" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" value={form.type} onChange={(e) => setType(e.target.value as MissionType)}>
            {(Object.keys(MISSION_TYPE_LABEL) as MissionType[]).map((t) => <option key={t} value={t}>{MISSION_TYPE_LABEL[t]}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="skill">Skill</Label>
          <Select id="skill" value={form.skill} onChange={(e) => set('skill', e.target.value as Skill)}>
            {SKILLS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="date">{form.type === 'homework' ? 'Assigned on' : 'Date'}</Label>
          <Input id="date" type="date" min={course?.startDate} max={course?.endDate} value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        {form.type === 'homework' ? (
          <div>
            <Label htmlFor="due">Due date</Label>
            <Input id="due" type="date" min={form.date} value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
        ) : (
          <div>
            <Label htmlFor="duration">Duration (min)</Label>
            <Input id="duration" type="number" min={5} step={5} value={form.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} />
          </div>
        )}
        {form.type === 'teacher_session' && (
          <>
            <div>
              <Label htmlFor="start">Start</Label>
              <Input id="start" type="time" value={form.startTime ?? ''} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <Input id="end" type="time" value={form.endTime ?? ''} onChange={(e) => set('endTime', e.target.value)} />
            </div>
          </>
        )}
      </div>
      <div>
        <Label htmlFor="desc">Instructions</Label>
        <Textarea id="desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What should the student do?" />
      </div>
    </Dialog>
  )
}
