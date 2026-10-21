import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { RHYTHMS, rhythmLabel } from '@/lib/habits'
import type { HabitDraft } from '@/types'

interface HabitFormProps {
  open: boolean
  onClose: () => void
  onSave: (habit: HabitDraft) => void
  /** The Habit to edit, or a new one with its skill, Stage and sort order filled in. */
  initial: HabitDraft
}

export function HabitForm({ open, onClose, onSave, initial }: HabitFormProps) {
  // mounted fresh for each edit, so `initial` is read once
  const [form, setForm] = useState<HabitDraft>(initial)

  const set = <K extends keyof HabitDraft>(key: K, value: HabitDraft[K]) => setForm((f) => ({ ...f, [key]: value }))

  function submit() {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial.id ? 'Edit Habit' : 'Add Habit'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div>
        <Label htmlFor="habit-title">Title</Label>
        <Input id="habit-title" value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} placeholder="e.g. BBC Learning English" />
      </div>
      <div>
        <Label htmlFor="habit-rhythm">Rhythm</Label>
        <Select id="habit-rhythm" value={form.timesPerWeek} onChange={(e) => set('timesPerWeek', Number(e.target.value))}>
          {RHYTHMS.map((n) => (
            <option key={n} value={n}>{rhythmLabel(n)}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="habit-desc">Details</Label>
        <Textarea id="habit-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What should the student do?" />
      </div>
    </Dialog>
  )
}
