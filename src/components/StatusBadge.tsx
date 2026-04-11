'use client'

import { STATUS_META } from '@/lib/constants'
import type { QsiStatus } from '@/lib/types'

export default function StatusBadge({ status }: { status: QsiStatus }) {
  const m = STATUS_META[status] || STATUS_META.nao_iniciado
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}
    >
      {m.icon} {m.label}
    </span>
  )
}
