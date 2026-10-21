import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label: string
}

export function Checkbox({ checked, onChange, disabled, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500',
        checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white hover:border-navy-500',
        disabled && 'cursor-default hover:border-slate-300',
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  )
}
