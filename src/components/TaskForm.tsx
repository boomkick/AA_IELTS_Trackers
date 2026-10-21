import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { weekOf } from '@/lib/stats'
import { useStore } from '@/lib/store'
import type { Skill, StudyTask, TaskType } from '@/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (task: StudyTask) => void
  initial?: StudyTask | null
  defaults?: Partial<StudyTask>
}

const empty = (defaults?: Partial<StudyTask>): StudyTask => ({
  id: '',
  weekNumber: 1,
  date: '2026-10-19',
  durationMin: 60,
  type: 'self_study',
  skill: 'Listening',
  title: '',
  description: '',
  ...defaults,
})

export function TaskForm({ open, onClose, onSave, initial, defaults }: TaskFormProps) {
  const { weeks } = useStore()
  const [form, setForm] = useState<StudyTask>(initial ?? empty(defaults))

  useEffect(() => {
    if (open) setForm(initial ?? empty(defaults))
    // reset only when the dialog opens; callers pass inline `defaults`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  const set = <K extends keyof StudyTask>(key: K, value: StudyTask[K]) => setForm((f) => ({ ...f, [key]: value }))

  function setType(type: TaskType) {
    setForm((f) => ({
      ...f,
      type,
      ...(type === 'teacher_session' ? { startTime: '20:00', endTime: '21:30', durationMin: 90 } : { startTime: undefined, endTime: undefined }),
      dueDate: type === 'homework' ? (f.dueDate ?? f.date) : undefined,
    }))
  }

  function submit() {
    if (!form.title.trim()) return
    // empty id = new task; the database assigns one
    onSave({ ...form, weekNumber: weekOf(weeks, form.date)?.number ?? 1 })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? 'Edit task' : form.type === 'homework' ? 'Assign homework' : 'Add task'}
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
          <Select id="type" value={form.type} onChange={(e) => setType(e.target.value as TaskType)}>
            <option value="teacher_session">Teacher-led</option>
            <option value="self_study">Self-study</option>
            <option value="homework">Homework</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="skill">Skill</Label>
          <Select id="skill" value={form.skill} onChange={(e) => set('skill', e.target.value as Skill)}>
            <option>Listening</option>
            <option>Reading</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">{form.type === 'homework' ? 'Assigned on' : 'Date'}</Label>
          <Input id="date" type="date" min="2026-10-19" max="2026-12-13" value={form.date} onChange={(e) => set('date', e.target.value)} />
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
