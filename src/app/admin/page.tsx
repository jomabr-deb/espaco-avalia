'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { ALL_SERIES, TURMA_COLORS, STATUS_META } from '@/lib/constants'
import type { Deadline, QsiStatus } from '@/lib/types'
import { daysUntil, formatDate } from '@/lib/utils'

interface Stats {
  totalAlunos: number
  totalInclusao: number
  porSerie: Record<string, number>
  qsiStatus: Record<string, number>
  qsiPendentes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: students } = await supabase.from('students').select('id, serie, inclusao').eq('ativo', true)
      const { data: dl } = await supabase.from('deadlines').select('*').eq('ativo', true).single()
      if (dl) setDeadline(dl)

      const sem = dl?.semestre ?? 1
      const ano = dl?.ano ?? new Date().getFullYear()
      const { data: responses } = await supabase.from('qsi_responses').select('student_id, status').eq('semestre', sem).eq('ano_letivo', ano)

      if (students) {
        const porSerie: Record<string, number> = {}
        ALL_SERIES.forEach(s => { porSerie[s] = 0 })
        students.forEach(s => { porSerie[s.serie] = (porSerie[s.serie] || 0) + 1 })

        const respMap: Record<string, string> = {}
        responses?.forEach(r => { respMap[r.student_id] = r.status })

        const qsiStatus: Record<string, number> = {}
        students.forEach(s => {
          const st = respMap[s.id] || 'nao_iniciado'
          qsiStatus[st] = (qsiStatus[st] || 0) + 1
        })

        setStats({
          totalAlunos: students.length,
          totalInclusao: students.filter(s => s.inclusao).length,
          porSerie,
          qsiStatus,
          qsiPendentes: (qsiStatus['nao_iniciado'] || 0) + (qsiStatus['rascunho'] || 0),
        })
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  const days = deadline ? daysUntil(deadline.data_limite) : null

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Painel Geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard value={stats?.totalAlunos ?? 0} label="Total de Alunos" color="text-blue-600" />
        <StatCard value={stats?.totalInclusao ?? 0} label="Inclusão" color="text-purple-600" />
        <StatCard value={stats?.qsiPendentes ?? 0} label="QSI Pendentes" color="text-red-500" />
        <StatCard value={days ?? '—'} label="Dias p/ Prazo" color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Students by serie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-4">Alunos por Turma</h3>
          {ALL_SERIES.map(serie => {
            const count = stats?.porSerie[serie] ?? 0
            const pct = stats ? (count / stats.totalAlunos) * 100 : 0
            return (
              <div key={serie} className="flex items-center gap-2.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TURMA_COLORS[serie] }} />
                <span className="text-sm flex-1">{serie}</span>
                <span className="text-sm font-semibold w-6 text-right">{count}</span>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: TURMA_COLORS[serie] }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* QSI Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-4">
            Status dos QSI {deadline && `— ${deadline.semestre}º Sem ${deadline.ano}`}
          </h3>
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const count = stats?.qsiStatus[key] || 0
            if (count === 0) return null
            return (
              <div key={key} className="flex items-center gap-2.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                <span className="text-sm flex-1">{meta.label}</span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            )
          })}

          {deadline && (
            <div className={`rounded-lg p-3 mt-4 border text-xs ${
              days !== null && days < 14 ? 'bg-red-50 border-red-200 text-red-700' :
              days !== null && days < 30 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              Prazo: {formatDate(deadline.data_limite)}
              {days !== null && ` (${days} dias restantes)`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}
