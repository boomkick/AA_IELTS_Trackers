import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { fmtDate } from '@/lib/utils'
import type { Course } from '@/types'

interface CourseEndFormProps {
  course: Course
  onClose: () => void
  onSave: (endDate: string) => void
}

/** The teacher moves the Course end date, e.g. to the exam date once it's booked. */
export function CourseEndForm({ course, onClose, onSave }: CourseEndFormProps) {
  const [endDate, setEndDate] = useState(course.endDate)
  // the database also refuses an end date on or before the start
  const valid = endDate > course.startDate

  function submit() {
    if (!valid) return
    onSave(endDate)
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Course end date"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>Save</Button>
        </>
      }
    >
      <div>
        <Label htmlFor="course-end">End date (the exam date once it's booked)</Label>
        <Input id="course-end" type="date" min={course.startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <p className="mt-1 text-xs text-slate-500">
          The Course started on {fmtDate(course.startDate, 'd MMM yyyy')}. The end date must be after it.
        </p>
      </div>
    </Dialog>
  )
}
