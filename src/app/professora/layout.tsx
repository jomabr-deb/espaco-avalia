'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import type { TeacherSession } from '@/lib/types'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TeacherSession | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [key, val] = c.trim().split('=')
        if (key && val) acc[key] = decodeURIComponent(val)
        return acc
      }, {} as Record<string, string>)
      if (cookies['teacher_session']) {
        setSession(JSON.parse(cookies['teacher_session']))
      }
    } catch { /* handled by middleware */ }
  }, [])

  async function handleLogout() {
    await fetch('/api/teacher-auth', { method: 'DELETE' })
    router.push('/login')
  }

  const turmaDisplay = session?.turmas
    .map(t => t.subturma ? `${t.serie} ${t.subturma}` : t.serie)
    .join(', ') ?? ''

  return (
    <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto">
      <header className="bg-[#101828] text-white px-5 py-3 flex items-center gap-3">
        <Logo size={32} />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">
            {session?.nome ?? 'Carregando...'}
          </div>
          <div className="text-[10px] text-white/40">{turmaDisplay}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition"
        >
          Sair
        </button>
      </header>
      {children}
    </div>
  )
}
