'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import StatusBadge from '@/components/StatusBadge'
import { ALL_SERIES, TURMA_COLORS, STATUS_META, LEVELS, LEVEL_META } from '@/lib/constants'
import { turmaLabel } from '@/lib/utils'
import type { Student, QsiResponse, QsiTemplate, Deadline, QsiStatus, Turma } from '@/lib/types'

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

  // Action buttons component (reused in table and mobile cards)
  function ActionButtons({ s }: { s: StudentWithQsi }) {
    const st = getStatus(s)
    return (
      <div className="flex gap-1 flex-wrap">
        {s.response && st !== 'nao_iniciado' && (
          <button onClick={() => setViewing(s)}
            className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-blue-50 text-blue-600">👁 Ver</button>
        )}
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
        {s.response && st !== 'nao_iniciado' && (
          <button onClick={() => window.open(`/api/export-qsi?id=${s.response!.id}`, '_blank')}
            className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-gray-50">⬇ DOCX</button>
        )}
      </div>
    )
  }

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
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap" style={{background:TURMA_COLORS[s.serie]}}>{turmaLabel(s)}</span>
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
                    <ActionButtons s={s} />
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
              <ActionButtons s={s} />
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* VIEW MODAL — Visualizar QSI completo  */}
      {/* ══════════════════════════════════════ */}
      {viewing && viewing.response && templates[viewing.serie] && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4"
          onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-semibold text-base">{viewing.nome}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {turmaLabel(viewing)} · QSI {deadline?.semestre}º Semestre {deadline?.ano} · <StatusBadge status={getStatus(viewing)} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCopy(viewing)}
                  className="px-2.5 py-1 rounded border border-gray-200 text-[11px] hover:bg-gray-50">📋 Copiar</button>
                <button onClick={() => window.open(`/api/export-qsi?id=${viewing.response!.id}`, '_blank')}
                  className="px-2.5 py-1 rounded border border-gray-200 text-[11px] hover:bg-gray-50">⬇ DOCX</button>
                <button onClick={() => setViewing(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 text-lg">✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              {templates[viewing.serie].sections.map((section, secIdx) => {
                const hasData = section.checklist.some((_, ci) =>
                  viewing.response!.checklist_data?.[`${secIdx}_${ci}`]
                ) || section.prompts.some((_, pi) =>
                  viewing.response!.text_data?.[`${secIdx}_${pi}`]
                )

                return (
                  <div key={secIdx} className="mb-6">
                    {/* Section title */}
                    <h3 className="text-sm font-bold text-blue-700 mb-1">{section.title}</h3>
                    {section.bncc && (
                      <p className="text-[10px] text-gray-400 mb-3 italic">{section.bncc}</p>
                    )}

                    {/* Checklist */}
                    {section.checklist.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                        {/* Checklist header */}
                        <div className="grid bg-gray-50 border-b border-gray-200" style={{gridTemplateColumns: '1fr 48px 48px 48px 48px'}}>
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500">Habilidade</div>
                          {LEVELS.map(l => (
                            <div key={l} className="px-1 py-1.5 text-center text-[10px] font-semibold" style={{color: LEVEL_META[l].color}}>{l}</div>
                          ))}
                        </div>
                        {/* Checklist rows */}
                        {section.checklist.map((item, ci) => {
                          const val = viewing.response!.checklist_data?.[`${secIdx}_${ci}`] || ''
                          return (
                            <div key={ci} className="grid border-b border-gray-100 last:border-0 hover:bg-gray-50"
                              style={{gridTemplateColumns: '1fr 48px 48px 48px 48px'}}>
                              <div className="px-3 py-2 text-[11px] text-gray-700 leading-relaxed">{item}</div>
                              {LEVELS.map(l => (
                                <div key={l} className="flex items-center justify-center">
                                  {val === l ? (
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                      style={{background: LEVEL_META[l].color}}>✓</span>
                                  ) : (
                                    <span className="w-5 h-5 rounded-full border border-gray-200" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Text responses */}
                    {section.prompts.map((prompt, pi) => {
                      const val = viewing.response!.text_data?.[`${secIdx}_${pi}`] || ''
                      if (!val) return null
                      return (
                        <div key={pi} className="mb-2">
                          <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{prompt}</p>
                          <div className="bg-gray-50 rounded-lg p-3 text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {val}
                          </div>
                        </div>
                      )
                    })}

                    {/* Empty section indicator */}
                    {!hasData && section.checklist.length > 0 && (
                      <p className="text-[11px] text-gray-300 italic">Seção não preenchida</p>
                    )}
                  </div>
                )
              })}

              {/* Observação da direção (if devolvido) */}
              {viewing.response!.observacao_direcao && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                  <p className="text-[11px] font-semibold text-orange-700 mb-1">↩ Observação da direção:</p>
                  <p className="text-[12px] text-orange-800">{viewing.response!.observacao_direcao}</p>
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between">
              <div className="text-[11px] text-gray-400">
                Progresso: {getProgress(viewing)}% · {Object.keys(viewing.response!.checklist_data || {}).length} itens preenchidos
              </div>
              <div className="flex gap-2">
                {getStatus(viewing) === 'finalizado' && (
                  <button onClick={() => { handleStatusChange(viewing.response!.id, 'em_revisao'); setViewing(null); }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs hover:bg-gray-50">🔍 Revisar</button>
                )}
                {getStatus(viewing) === 'em_revisao' && (<>
                  <button onClick={() => { setShowDevolve(viewing.response!.id); setViewing(null); }}
                    className="px-3 py-1.5 rounded-lg border border-orange-300 text-xs text-orange-600 hover:bg-orange-50">↩ Devolver</button>
                  <button onClick={() => { handleStatusChange(viewing.response!.id, 'validado'); setViewing(null); }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs">✓ Validar</button>
                </>)}
                <button onClick={() => setViewing(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
