'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import { ALL_SERIES, TURMA_COLORS } from '@/lib/constants'
import { turmaLabel, calcAge, formatDate } from '@/lib/utils'
import type { Student } from '@/lib/types'

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('Todas')
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    const supabase = createClient()
    let query = supabase.from('students').select('*').order('nome')
    if (!showInactive) query = query.eq('ativo', true)
    const { data } = await query
    if (data) setStudents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [showInactive])

  const filtered = students.filter(s => {
    if (filter !== 'Todas' && s.serie !== filter) return false
    if (search && !s.nome.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    await adminAction('update_student', {
      id: editing.id,
      nome: editing.nome,
      nascimento: editing.nascimento,
      serie: editing.serie,
      subturma: editing.subturma,
      turno: editing.turno,
      inclusao: editing.inclusao,
      resp_fin_nome: editing.resp_fin_nome,
      resp_fin_celular: editing.resp_fin_celular,
      resp_fin_email: editing.resp_fin_email,
      resp_ped_nome: editing.resp_ped_nome,
      resp_ped_celular: editing.resp_ped_celular,
      resp_ped_email: editing.resp_ped_email,
      observacoes: editing.observacoes,
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  async function handleDeactivate(student: Student) {
    if (!confirm(`Desativar ${student.nome}? Os dados serão preservados.`)) return
    await adminAction('deactivate_student', { id: student.id })
    load()
  }

  async function handleReactivate(student: Student) {
    await adminAction('reactivate_student', { id: student.id })
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Alunos</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
            📥 Importar ERP (.xls)
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium">
            📤 Exportar Dados
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {['Todas', ...ALL_SERIES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-[11px] border cursor-pointer transition ${
                filter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Inativos
          </label>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-2">{filtered.length} aluno{filtered.length !== 1 && 's'}</p>

      {/* Mobile: cards / Desktop: table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50">
              {['Nome','Turma','Turno','Idade','Resp. Financeiro','Resp. Pedagógico','Inclusão',''].map(h =>
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-200">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className={`hover:bg-gray-50 ${!s.ativo ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 border-b border-gray-100 font-medium">{s.nome}</td>
                <td className="px-3 py-2 border-b border-gray-100">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap" style={{background:TURMA_COLORS[s.serie]}}>{turmaLabel(s)}</span>
                </td>
                <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{s.turno}</td>
                <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{calcAge(s.nascimento)}</td>
                <td className="px-3 py-2 border-b border-gray-100 text-gray-500 text-[11px]">{s.resp_fin_nome}</td>
                <td className="px-3 py-2 border-b border-gray-100 text-gray-500 text-[11px]">{s.resp_ped_nome}</td>
                <td className="px-3 py-2 border-b border-gray-100">
                  {s.inclusao && <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">SIM</span>}
                </td>
                <td className="px-3 py-2 border-b border-gray-100">
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({...s})} className="px-2 py-0.5 rounded border border-gray-200 text-[10px] hover:bg-gray-50">✏️ Editar</button>
                    {s.ativo ?
                      <button onClick={() => handleDeactivate(s)} className="px-2 py-0.5 rounded border border-gray-200 text-[10px] text-red-500 hover:bg-red-50">Desativar</button> :
                      <button onClick={() => handleReactivate(s)} className="px-2 py-0.5 rounded border border-gray-200 text-[10px] text-green-600 hover:bg-green-50">Reativar</button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-1.5">
        {filtered.map(s => (
          <div key={s.id} className={`bg-white border border-gray-200 rounded-xl p-3 ${!s.ativo ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{background:TURMA_COLORS[s.serie]}}>{s.nome.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">
                  {s.nome}
                  {s.inclusao && <span className="ml-1 text-[9px] font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">INCLUSÃO</span>}
                </div>
                <div className="text-[11px] text-gray-400">{turmaLabel(s)} · {s.turno}</div>
              </div>
              <button onClick={() => setEditing({...s})} className="text-xs text-gray-400">✏️</button>
            </div>
            <div className="text-[11px] text-gray-400">RF: {s.resp_fin_nome} · RP: {s.resp_ped_nome}</div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Editar Aluno</h3>

            <div className="space-y-3 text-sm">
              <Field label="Nome" value={editing.nome} onChange={v => setEditing({...editing, nome: v})} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Série</label>
                  <select value={editing.serie} onChange={e => setEditing({...editing, serie: e.target.value})}
                    className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm">
                    {ALL_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="Subturma" value={editing.subturma||''} onChange={v => setEditing({...editing, subturma: v||null})} />
                <Field label="Turno" value={editing.turno||''} onChange={v => setEditing({...editing, turno: v||null})} />
              </div>
<div>
  <label className="text-xs text-gray-500 block mb-1">Data de nascimento</label>
  <input type="date" value={editing.nascimento || ''} onChange={e => setEditing({...editing, nascimento: e.target.value || null})}
    className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editing.inclusao} onChange={e => setEditing({...editing, inclusao: e.target.checked})} />
                Aluno de inclusão
              </label>

              <hr className="border-gray-100" />
              <p className="text-xs text-gray-400 font-semibold">Responsável Financeiro</p>
              <Field label="Nome" value={editing.resp_fin_nome||''} onChange={v => setEditing({...editing, resp_fin_nome: v})} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Celular" value={editing.resp_fin_celular||''} onChange={v => setEditing({...editing, resp_fin_celular: v})} />
                <Field label="Email" value={editing.resp_fin_email||''} onChange={v => setEditing({...editing, resp_fin_email: v})} />
              </div>

              <hr className="border-gray-100" />
              <p className="text-xs text-gray-400 font-semibold">Responsável Pedagógico</p>
              <Field label="Nome" value={editing.resp_ped_nome||''} onChange={v => setEditing({...editing, resp_ped_nome: v})} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Celular" value={editing.resp_ped_celular||''} onChange={v => setEditing({...editing, resp_ped_celular: v})} />
                <Field label="Email" value={editing.resp_ped_email||''} onChange={v => setEditing({...editing, resp_ped_email: v})} />
              </div>

              <hr className="border-gray-100" />
              <Field label="Observações" value={editing.observacoes||''} onChange={v => setEditing({...editing, observacoes: v})} textarea />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, textarea }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean
}) {
  const cls = "w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} className={cls + ' min-h-[60px] resize-y'} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />
      }
    </div>
  )
}
