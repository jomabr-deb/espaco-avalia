'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import { TURMA_COLORS } from '@/lib/constants'
import type { Teacher, Turma } from '@/lib/types'

interface TeacherWithTurmas extends Teacher {
  turmas: { serie: string; subturma: string | null }[]
}

export default function ProfessorasPage() {
  const [teachers, setTeachers] = useState<TeacherWithTurmas[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TeacherWithTurmas | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data: tchrs } = await supabase.from('teachers').select('*').order('nome')
    const { data: turmas } = await supabase.from('turmas').select('*').eq('ano_letivo', new Date().getFullYear())

    const turmaMap: Record<string, { serie: string; subturma: string | null }[]> = {}
    turmas?.forEach(t => {
      if (!turmaMap[t.teacher_id]) turmaMap[t.teacher_id] = []
      turmaMap[t.teacher_id].push({ serie: t.serie, subturma: t.subturma })
    })

    setTeachers((tchrs || []).map(t => ({ ...t, turmas: turmaMap[t.id] || [] })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRegenerate(id: string) {
    if (!confirm('Gerar novo código de acesso? O código anterior será invalidado.')) return
    const { code } = await adminAction('regenerate_code', { id })
    alert(`Novo código: ${code}`)
    load()
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    await adminAction('update_teacher', {
      id: editing.id,
      nome: editing.nome,
      email: editing.email,
      cpf: editing.cpf,
      ativo: editing.ativo,
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Professoras</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
            📥 Importar Base (.xlsx)
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium">
            + Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {teachers.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border border-gray-200 p-4 ${!t.ativo ? 'opacity-50' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-semibold">{t.nome}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{t.email || '—'}</div>
                {t.cpf && <div className="text-[11px] text-gray-400">CPF: {t.cpf}</div>}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                t.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>{t.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>

            {/* Turmas */}
            <div className="mb-3">
              <span className="text-[11px] text-gray-400">Turmas: </span>
              {t.turmas.length > 0
                ? t.turmas.map((turma, i) => (
                    <span key={i} className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1"
                      style={{background: TURMA_COLORS[turma.serie]}}>
                      {turma.subturma ? `${turma.serie} ${turma.subturma}` : turma.serie}
                    </span>
                  ))
                : <span className="text-[11px] text-gray-300">Sem turma atribuída</span>
              }
            </div>

            {/* Code + actions */}
            <div className="flex items-center justify-between">
              <div className="text-[11px]">
                <span className="text-gray-400">Código: </span>
                {t.access_code
                  ? <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.access_code}</span>
                  : <span className="text-gray-300">—</span>
                }
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing({...t})}
                  className="px-2 py-1 rounded border border-gray-200 text-[10px] hover:bg-gray-50">✏️ Editar</button>
                {t.access_code && (
                  <button onClick={() => handleRegenerate(t.id)}
                    className="px-2 py-1 rounded border border-gray-200 text-[10px] hover:bg-gray-50">🔄 Novo Código</button>
                )}
              </div>
            </div>

            {/* Last access */}
            {t.ultimo_acesso && (
              <div className="text-[10px] text-gray-300 mt-2">
                Último acesso: {new Date(t.ultimo_acesso).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Editar Professora</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nome</label>
                <input value={editing.nome} onChange={e => setEditing({...editing, nome: e.target.value})}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input value={editing.email || ''} onChange={e => setEditing({...editing, email: e.target.value})}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">CPF</label>
                <input value={editing.cpf || ''} onChange={e => setEditing({...editing, cpf: e.target.value})}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editing.ativo} onChange={e => setEditing({...editing, ativo: e.target.checked})} />
                Ativo
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
