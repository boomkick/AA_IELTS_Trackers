import { useState } from 'react'
import { Check, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import type { VocabItem } from '@/types'

export function Vocabulary() {
  const { user, vocab, reviewed, toggleReviewed, addVocab, deleteVocab } = useStore()
  const isTeacher = user?.role === 'teacher'
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const q = query.trim().toLowerCase()
  const list = vocab.filter(
    (v) => !q || v.word.toLowerCase().includes(q) || v.meaningVi.toLowerCase().includes(q) || v.definitionEn.toLowerCase().includes(q),
  )

  return (
    <>
      <PageHeader
        title="Vocabulary"
        subtitle={`${vocab.length} words · ${reviewed.filter((id) => vocab.some((v) => v.id === id)).length} reviewed`}
        actions={isTeacher && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add word</Button>}
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search word or meaning…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((v) => {
          const isReviewed = reviewed.includes(v.id)
          return (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {v.word} <span className="ml-1 text-sm font-normal text-slate-500">{v.ipa}</span>
                  </p>
                  <p className="text-sm font-medium text-navy-700">{v.meaningVi}</p>
                </div>
                {isTeacher ? (
                  <Button variant="ghost" size="icon" onClick={() => deleteVocab(v.id)} aria-label={`Delete ${v.word}`}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                ) : (
                  <button
                    onClick={() => toggleReviewed(v.id)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                      isReviewed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {isReviewed && <Check className="h-3 w-3" />} {isReviewed ? 'Reviewed' : 'Mark reviewed'}
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-700">{v.definitionEn}</p>
              <p className="mt-1 text-sm italic text-slate-500">“{v.example}”</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {v.collocations.map((c) => (
                  <span key={c} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{c}</span>
                ))}
              </div>
            </Card>
          )
        })}
        {list.length === 0 && <p className="text-sm text-slate-500">No words match.</p>}
      </div>

      <VocabForm open={formOpen} onClose={() => setFormOpen(false)} onSave={addVocab} />
    </>
  )
}

function VocabForm({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: Omit<VocabItem, 'id'>) => void }) {
  const blank = { word: '', ipa: '', definitionEn: '', meaningVi: '', example: '', collocations: '' }
  const [f, setF] = useState(blank)
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  function submit() {
    if (!f.word.trim()) return
    onSave({
      word: f.word.trim(),
      ipa: f.ipa,
      definitionEn: f.definitionEn,
      meaningVi: f.meaningVi,
      example: f.example,
      collocations: f.collocations.split(',').map((c) => c.trim()).filter(Boolean),
    })
    setF(blank)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add word"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!f.word.trim()}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Word</Label><Input value={f.word} onChange={set('word')} /></div>
        <div><Label>IPA</Label><Input value={f.ipa} onChange={set('ipa')} placeholder="/.../" /></div>
      </div>
      <div><Label>English definition</Label><Input value={f.definitionEn} onChange={set('definitionEn')} /></div>
      <div><Label>Vietnamese meaning</Label><Input value={f.meaningVi} onChange={set('meaningVi')} /></div>
      <div><Label>Example</Label><Textarea value={f.example} onChange={set('example')} className="min-h-16" /></div>
      <div><Label>Collocations</Label><Input value={f.collocations} onChange={set('collocations')} placeholder="comma separated" /></div>
    </Dialog>
  )
}
