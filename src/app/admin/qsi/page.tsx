'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import StatusBadge from '@/components/StatusBadge'
import { ALL_SERIES, TURMA_COLORS, STATUS_META } from '@/lib/constants'
import { turmaLabel } from '@/lib/utils'
import type { Student, QsiResponse, QsiTemplate, Deadline, QsiStatus, Teacher, Turma } from '@/lib/types'

interface StudentWithQsi extends Student {
  response?: QsiResponse
  teacherName?: string
}

export default function QsiPage() {
  const [students, setStudents] = useState<StudentWithQsi[]>([])
  const [filter, setFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [templates, setTemplates] = useState<Record<string, QsiTemplate>>({})
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<StudentWithQsi | null>(null)
  const [devolveObs, setDevolveObs] = useState('')
  const [showDevolve, setShowDevolve] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()

    const { data: dl } = await supabase.from('deadlines').select('*').eq('ativo', true).single()
    if (dl) setDeadline(dl)
    const sem = dl?.semestre ?? 1
    const ano = dl?.ano ?? new Date().getFullYear()

    const { data: studs } = await supabase.from('students').select('*').eq('ativo', true).order('nome')
    const { data: resps } = await supabase.from('qsi_responses').select('*').eq('semestre', sem).eq('ano_letivo', ano)
    const { data: tmpls } = await supabase.from('qsi_templates').select('*').eq('semestre', sem).eq('ativo', true)
    const { data: turmas } = await supabase.from('turmas').select('*, teachers(nome)').eq('ano_letivo', ano)

    const respMap: Record<string, QsiResponse> = {}
    resps?.forEach(r => { respMap[r.student_id] = r })

    const tmplMap: Record<string, QsiTemplate> = {}
    tmpls?.forEach(t => { tmplMap[t.serie] = t })
    setTemplates(tmplMap)

    const teacherMap: Record<string, string> = {}
    turmas?.forEach((t: Turma & { teachers: { nome: string } | null }) => {
      const key = t.subturma ? `${t.serie}_${t.subturma}` : t.serie
      if (t.teachers) teacherMap[key] = t.teachers.nome
    })

    const merged: StudentWithQsi[] = (studs || []).map(s => ({
      ...s,
      response: respMap[s.id],
      teacherName: teacherMap[s.subturma ? `${s.serie}_${s.subturma}` : s.serie],
    }))

    setStudents(merged)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function getStatus(s: StudentWithQsi): QsiStatus {
    return s.response?.status ?? 'nao_iniciado'
  }

  function getProgress(s: StudentWithQsi): number {
    if (!s.response || !templates[s.serie]) return 0
    const total = templates[s.serie].sections.reduce((a, sec) => a + sec.checklist.length, 0)
    if (!total) return 0
    return Math.round((Object.keys(s.response.checklist_data || {}).length / total) * 100)
  }

  async function handleStatusChange(respId: string, newStatus: string, obs?: string) {
    await adminAction('qsi_change_status', { id: respId, newStatus, obs })
    setShowDevolve(null)
    setDevolveObs('')
    load()
  }

  function handleCopy(s: StudentWithQsi) {
    if (!s.response || !templates[s.serie]) return
    const tmpl = templates[s.serie]
    let text = `QSI — ${s.nome} — ${turmaLabel(s)} — ${deadline?.semestre}º Sem ${deadline?.ano}\n\n`

    tmpl.sections.forEach((sec, si) => {
      text += `${sec.title}\n`
      sec.checklist.forEach((item, ci) => {
        const val = s.response!.checklist_data?.[`${si}_${ci}`] || '—'
        text += `  [${val}] ${item}\n`
      })
      sec.prompts.forEach((prompt, pi) => {
        const val = s.response!.text_data?.[`${si}_${pi}`] || ''
        if (val) text += `  ${prompt}\n  → ${val}\n`
      })
      text += '\n'
    })

    navigator.clipboard.writeText(text)
    alert('Dados copiados para a área de transferência!')
  }

  const filtered = students.filter(s => {
    if (filter !== 'Todas' && s.serie !== filter) return false
    if (statusFilter !== 'Todos' && getStatus(s) !== statusFilter) return false
    return true
  })

  // Status counts
  const counts: Record<string, number> = {}
  students.forEach(s => { const st = getStatus(s); counts[st] = (counts[st] || 0) + 1 })

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Questionários de Sondagem</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
            ⬇ Exportar Lote (ZIP)
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium">
            📊 Planilha Resumo
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 flex-wrap mb-4">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const c = counts[key] || 0
          if (c === 0) return null
          return (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'Todos' : key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition cursor-pointer ${
                statusFilter === key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white'
              }`}>
              <span className="w-2 h-2 rounded-full" style={{background: statusFilter === key ? '#fff' : meta.color}} />
              {meta.label}: {c}
            </button>
          )
        })}
        {statusFilter !== 'Todos' && (
          <button onClick={() => setStatusFilter('Todos')} className="text-[11px] text-gray-400 hover:text-gray-600">✕ Limpar</button>
        )}
      </div>

      {/* Turma filter */}
      <div className="flex gap-1 flex-wrap mb-4">
        {['Todas', ...ALL_SERIES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-[11px] border cursor-pointer transition ${
              filter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            }`}>{s}</button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} registro{filtered.length !== 1 && 's'}</p>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50">
              {['Aluno','Turma','Professora','Status','Progresso','Ações'].map(h =>
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-200">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const st = getStatus(s)
              const prog = getProgress(s)
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b border-gray-100 font-medium">
                    {s.nome} {s.inclusao && <span className="text-[9px] font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">INC</span>}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{background:TURMA_COLORS[s.serie]}}>{turmaLabel(s)}</span>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{s.teacherName || '—'}</td>
                  <td className="px-3 py-2 border-b border-gray-100"><StatusBadge status={st} /></td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    {st !== 'nao_iniciado' && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 rounded-full" style={{width:`${prog}%`, background: prog===100?'#16a34a':'#2563eb'}} />
                        </div>
                        <span className="text-[10px] text-gray-400">{prog}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    <div className="flex gap-1">
                      {st === 'finalizado' && s.response && (
                        <button onClick={() => handleStatusChange(s.response!.id, 'em_revisao')}
                          className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-gray-50">🔍 Revisar</button>
                      )}
                      {st === 'em_revisao' && s.response && (<>
                        <button onClick={() => setShowDevolve(s.response!.id)}
                          className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-orange-50">↩ Devolver</button>
                        <button onClick={() => handleStatusChange(s.response!.id, 'validado')}
                          className="px-2 py-0.5 rounded bg-teal-600 text-white text-[10px]">✓ Validar</button>
                      </>)}
                      {s.response && st !== 'nao_iniciado' && (
                        <button onClick={() => handleCopy(s)} className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-gray-50">📋 Copiar</button>
                      )}
                      <button className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-gray-50">⬇ DOCX</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-1.5">
        {filtered.map(s => {
          const st = getStatus(s)
          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium truncate">{s.nome}</span>
                <StatusBadge status={st} />
              </div>
              <div className="text-[11px] text-gray-400 mb-2">{turmaLabel(s)} · {s.teacherName || '—'}</div>
              <div className="flex gap-1 flex-wrap">
                {st === 'finalizado' && s.response && (
                  <button onClick={() => handleStatusChange(s.response!.id, 'em_revisao')}
                    className="px-2 py-1 rounded border border-gray-200 text-[10px]">🔍 Revisar</button>
                )}
                {st === 'em_revisao' && s.response && (<>
                  <button onClick={() => setShowDevolve(s.response!.id)}
                    className="px-2 py-1 rounded border border-gray-200 text-[10px]">↩ Devolver</button>
                  <button onClick={() => handleStatusChange(s.response!.id, 'validado')}
                    className="px-2 py-1 rounded bg-teal-600 text-white text-[10px]">✓ Validar</button>
                </>)}
                {s.response && <button onClick={() => handleCopy(s)} className="px-2 py-1 rounded border border-gray-200 text-[10px]">📋 Copiar</button>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Devolve modal */}
      {showDevolve && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDevolve(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Devolver QSI para ajustes</h3>
            <label className="text-xs text-gray-500 block mb-1">Observação para a professora:</label>
            <textarea value={devolveObs} onChange={e => setDevolveObs(e.target.value)}
              placeholder="Ex: Revisar seção 4 — faltam campos descritivos"
              className="w-full p-3 rounded-lg border border-gray-200 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleStatusChange(showDevolve, 'devolvido', devolveObs)}
                disabled={!devolveObs.trim()}
                className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
                ↩ Devolver
              </button>
              <button onClick={() => { setShowDevolve(null); setDevolveObs(''); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
