import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'

export function ErrorLog() {
  return (
    <>
      <PageHeader title="Error Log" />
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Under construction</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">This page is coming soon.</p>
      </Card>
    </>
  )
}
