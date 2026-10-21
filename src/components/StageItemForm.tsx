import { useState, type ReactNode } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'

/** What a Goal and a Habit draft have in common. */
interface StageItemDraft {
  id?: string
  title: string
  description: string
}

interface StageItemFormProps<T extends StageItemDraft> {
  noun: 'Goal' | 'Habit'
  /** The item to edit, or a new one with its skill, Stage and sort order filled in. */
  initial: T
  titlePlaceholder: string
  /** The field that differs: a Goal's due date or a Habit's rhythm. */
  extraField: (form: T, set: <K extends keyof T>(key: K, value: T[K]) => void) => ReactNode
  onClose: () => void
  onSave: (item: T) => void
}

/** One dialog for adding or editing a Goal or a Habit. Mounted fresh for each edit, so `initial` is read once. */
export function StageItemForm<T extends StageItemDraft>({ noun, initial, titlePlaceholder, extraField, onClose, onSave }: StageItemFormProps<T>) {
  const [form, setForm] = useState<T>(initial)
  const set = <K extends keyof T>(key: K, value: T[K]) => setForm((f) => ({ ...f, [key]: value }))
  const id = noun.toLowerCase()

  function submit() {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={initial.id ? `Edit ${noun}` : `Add ${noun}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div>
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input id={`${id}-title`} value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} placeholder={titlePlaceholder} />
      </div>
      {extraField(form, set)}
      <div>
        <Label htmlFor={`${id}-desc`}>Details</Label>
        <Textarea id={`${id}-desc`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What should the student do?" />
      </div>
    </Dialog>
  )
}
