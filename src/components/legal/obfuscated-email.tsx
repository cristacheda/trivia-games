import { useState } from 'react'
import {
  getLegalContactEmailAddress,
  getLegalContactEmailDisplay,
} from '@/config/legal'
import { Button } from '@/components/ui/button'

export function ObfuscatedEmail() {
  const [copyLabel, setCopyLabel] = useState('Copy email')
  const displayEmail = getLegalContactEmailDisplay()

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(getLegalContactEmailAddress())
      setCopyLabel('Copied')
      window.setTimeout(() => setCopyLabel('Copy email'), 1500)
    } catch {
      setCopyLabel('Copy failed')
      window.setTimeout(() => setCopyLabel('Copy email'), 1500)
    }
  }

  const openMail = () => {
    window.location.href = `mailto:${getLegalContactEmailAddress()}`
  }

  return (
    <div className="rounded-[24px] bg-white/70 p-4 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">Contact email</p>
      <p className="mt-2 break-all">{displayEmail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void copyEmail()} size="sm" variant="secondary">
          {copyLabel}
        </Button>
        <Button onClick={openMail} size="sm" variant="outline">
          Open mail app
        </Button>
      </div>
    </div>
  )
}
