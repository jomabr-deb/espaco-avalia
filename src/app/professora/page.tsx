'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Deadline, TeacherSession } from '@/lib/types'
import { daysUntil, formatDate, deadlineUrgency } from '@/lib/utils'

export default function TeacherHome() {
  const [session, setSession] = useState<TeacherSession | null>(null)
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [studentCount, setStudentCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const cookies = document.cookie.split(';').reduce((acc, c) => {
          const [key, val] = c.trim().split('=')
          if (key && val) acc[key] = decodeURIComponent(val)
          return acc
        }, {} as Record<string, string>)

        if (cookies['teacher_session']) {
          const s = JSON.parse(cookies['teacher_session']) as TeacherSession
          setSession(s)

          const supabase = createClient()
          let count = 0
          for (const turma of s.turmas) {
            let query = supabase
              .from('students')
              .select('id', { count: 'exact', head: true })
              .eq('serie', turma.serie)
              .eq('ativo', true)
            if (turma.subturma) {
              query = query.eq('subturma', turma.subturma)
            }
            const { count: c } = await query
            count += c ?? 0
          }
          setStudentCount(count)

          const { data: dl } = await supabase
            .from('deadlines')
            .select('*')
            .eq('ativo', true)
            .single()
          if (dl) setDeadline(dl)
        }
      } catch (e) {
        console.error('Error loading teacher data:', e)
      }
    }
    load()
  }, [])

  const days = deadline ? daysUntil(deadline.data_limite) : null
  const urgency = days !== null ? deadlineUrgency(days) : null
  const firstName = session?.nome.split(' ')[0] ?? ''

  return (
    <div>
      {deadline && (
        <div className={`px-5 py-3 flex items-center gap-2.5 border-b border-gray-200 ${
          urgency === 'red' ? 'bg-red-50' :
          urgency === 'amber' ? 'bg-amber-50' :
          urgency === 'expired' ? 'bg-gray-100' :
          'bg-green-50'
        }`}>
          <span className="text-lg">{urgency === 'red' || urgency === 'expired' ? '⚠️' : '📋'}</span>
          <div>
            <div className={`text-xs font-semibold ${
              urgency === 'red' ? 'text-red-600' :
              urgency === 'amber' ? 'text-amber-600' :
              urgency === 'expired' ? 'text-gray-500' :
              'text-green-600'
            }`}>
              QSI — {deadline.semestre}º Semestre {deadline.ano}
            </div>
            <div className="text-[11px] text-gray-500">
              Prazo: {formatDate(deadline.data_limite)}
              {days !== null && days > 0 && ` (${days} dias restantes)`}
              {days === 0 && ' (vence hoje!)'}
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-5">
          Olá, {firstName} 👋
        </h2>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-blue-600">{studentCount}</div>
            <div className="text-[11px] text-gray-400">Alunos</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-amber-500">0</div>
            <div className="text-[11px] text-gray-400">Em andamento</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-orange-500">0</div>
            <div className="text-[11px] text-gray-400">Devolvidos</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <a
            href="/professora/qsi"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 text-white no-underline hover:bg-gray-800 transition"
          >
            <span className="text-lg">📝</span>
            <div>
              <div className="font-semibold text-sm">Preencher QSI</div>
              <div className="text-[11px] text-white/60">
                {deadline ? `${deadline.semestre}º Semestre ${deadline.ano}` : 'Questionário de Sondagem'}
              </div>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </a>

          <a
            href="/professora/docs"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 text-gray-900 no-underline hover:bg-gray-50 transition"
          >
            <span className="text-lg">📁</span>
            <div>
              <div className="font-semibold text-sm">Consultar Documentos</div>
              <div className="text-[11px] text-gray-400">Pareceres, Estudos de Caso, PAEE, PEI</div>
            </div>
            <span className="ml-auto text-gray-300">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
