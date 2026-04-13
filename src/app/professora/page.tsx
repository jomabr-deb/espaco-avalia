'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useTeacherSession } from '@/lib/hooks'
import type { Deadline } from '@/lib/types'
import { daysUntil, formatDate, deadlineUrgency } from '@/lib/utils'

export default function TeacherHome() {
  const { session, loading: sessionLoading } = useTeacherSession()
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [rascunhoCount, setRascunhoCount] = useState(0)
  const [devolvidoCount, setDevolvidoCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading || !session) return

    async function load() {
      const supabase = createClient()

      // Count students for this teacher's turmas
      let total = 0
      for (const turma of session!.turmas) {
        let query = supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('serie', turma.serie)
          .eq('ativo', true)
        if (turma.subturma) query = query.eq('subturma', turma.subturma)
        const { count } = await query
        total += count ?? 0
      }
      setStudentCount(total)

      // Count QSI by status
      const { data: responses } = await supabase
        .from('qsi_responses')
        .select('status')
        .eq('teacher_id', session!.teacher_id)
      if (responses) {
        setRascunhoCount(responses.filter(r => r.status === 'rascunho').length)
        setDevolvidoCount(responses.filter(r => r.status === 'devolvido').length)
      }

      // Active deadline
      const { data: dl } = await supabase
        .from('deadlines')
        .select('*')
        .eq('ativo', true)
        .single()
      if (dl) setDeadline(dl)

      setLoading(false)
    }
    load()
  }, [session, sessionLoading])

  if (loading || sessionLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
  }

  const days = deadline ? daysUntil(deadline.data_limite) : null
  const urgency = days !== null ? deadlineUrgency(days) : null
  const firstName = session?.nome.split(' ')[0] ?? ''

  return (
    <div>
      {/* Deadline banner */}
      {deadline && (
        <div className={`px-5 py-3 flex items-center gap-2.5 border-b border-gray-200 ${
          urgency === 'red' ? 'bg-red-50' :
          urgency === 'amber' ? 'bg-amber-50' :
          urgency === 'expired' ? 'bg-gray-100' : 'bg-green-50'
        }`}>
          <span className="text-lg">{urgency === 'red' || urgency === 'expired' ? '⚠️' : '📋'}</span>
          <div>
            <div className={`text-xs font-semibold ${
              urgency === 'red' ? 'text-red-600' : urgency === 'amber' ? 'text-amber-600' :
              urgency === 'expired' ? 'text-gray-500' : 'text-green-600'
            }`}>QSI — {deadline.semestre}º Semestre {deadline.ano}</div>
            <div className="text-[11px] text-gray-500">
              Prazo: {formatDate(deadline.data_limite)}
              {days !== null && days > 0 && ` (${days} dias restantes)`}
              {days === 0 && ' (vence hoje!)'}
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-5">Olá, {firstName} 👋</h2>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-blue-600">{studentCount}</div>
            <div className="text-[11px] text-gray-400">Alunos</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-amber-500">{rascunhoCount}</div>
            <div className="text-[11px] text-gray-400">Em andamento</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 text-center">
            <div className="text-xl font-bold text-orange-500">{devolvidoCount}</div>
            <div className="text-[11px] text-gray-400">Devolvidos</div>
          </div>
        </div>
{/* Legenda */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-1">
          <p className="text-[11px] text-gray-400 font-semibold mb-2">Legenda do QSI</p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{background:'#6b7280'}}>NA</span>
              <span className="text-[11px] text-gray-600">Não apresenta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{background:'#dc2626'}}>AP</span>
              <span className="text-[11px] text-gray-600">Com apoio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{background:'#d97706'}}>ED</span>
              <span className="text-[11px] text-gray-600">Em desenvolvimento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{background:'#16a34a'}}>C</span>
              <span className="text-[11px] text-gray-600">Consolidado</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <a href="/professora/qsi"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 text-white no-underline hover:bg-gray-800 transition">
            <span className="text-lg">📝</span>
            <div>
              <div className="font-semibold text-sm">Preencher QSI</div>
              <div className="text-[11px] text-white/60">
                {deadline ? `${deadline.semestre}º Semestre ${deadline.ano}` : 'Questionário de Sondagem'}
              </div>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </a>
          <a href="/professora/docs"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 text-gray-900 no-underline hover:bg-gray-50 transition">
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
