import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import type { GoalDraft } from '@/types'


interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSave: (goal: GoalDraft) => void
  /** The Goal to edit, or a new one with its skill, Stage and sort order filled in. */
  initial: GoalDraft
}

export function GoalForm({ open, onClose, onSave, initial }: GoalFormProps) {
  // mounted fresh for each edit, so `initial` is read once
  const [form, setForm] = useState<GoalDraft>(initial)

  const set = <K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) => setForm((f) => ({ ...f, [key]: value }))

  function submit() {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial.id ? 'Edit Goal' : 'Add Goal'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div>
        <Label htmlFor="goal-title">Title</Label>
        <Input id="goal-title" value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Matching headings: 3 practice sets" />
      </div>
      <div>
        <Label htmlFor="goal-due">Due date (optional)</Label>
        <Input id="goal-due" type="date" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} />
      </div>
      <div>
        <Label htmlFor="goal-desc">Details</Label>
        <Textarea id="goal-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What should the student do?" />
      </div>
    </Dialog>
  )
}
