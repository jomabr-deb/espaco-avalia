'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import { formatDate } from '@/lib/utils'
import type { Deadline } from '@/lib/types'

export default function ConfigPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDeadline, setShowNewDeadline] = useState(false)
  const [newAno, setNewAno] = useState(new Date().getFullYear())
  const [newSem, setNewSem] = useState(1)
  const [newData, setNewData] = useState('')
  const [newAtraso, setNewAtraso] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('deadlines').select('*').order('ano', { ascending: false })
    if (data) setDeadlines(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    setSaving(true)
    await adminAction('create_deadline', {
      ano: newAno,
      semestre: newSem,
      data_limite: newData,
      permitir_atraso: newAtraso,
    })
    setSaving(false)
    setShowNewDeadline(false)
    setNewData('')
    load()
  }

  async function toggleAtraso(dl: Deadline) {
    await adminAction('update_deadline', { id: dl.id, permitir_atraso: !dl.permitir_atraso })
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-4">⏰ Prazos do QSI</h3>

          {deadlines.map(dl => (
            <div key={dl.id} className={`rounded-lg p-3 mb-2 border ${
              dl.ativo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold">QSI — {dl.semestre}º Semestre {dl.ano}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Prazo: {formatDate(dl.data_limite)}</div>
                </div>
                {dl.ativo && (
                  <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">Ativo</span>
                )}
              </div>
              {dl.ativo && (
                <label className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={dl.permitir_atraso} onChange={() => toggleAtraso(dl)} />
                  Permitir preenchimento após o prazo
                </label>
              )}
            </div>
          ))}

          <button onClick={() => setShowNewDeadline(true)}
            className="mt-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">
            + Criar Novo Prazo
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-3">📥 Importação de Dados</h3>
          <p className="text-xs text-gray-500 mb-3">
            Importe a listagem do ERP para atualizar alunos. O sistema fará a conciliação automática
            mostrando matches, mudanças e novos registros antes de confirmar.
          </p>
          <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
            Selecionar Arquivo .xls
          </button>
          <p className="text-[10px] text-gray-400 mt-3">
            O processo inclui 4 etapas: Upload → Matching → Conciliação → Confirmação.<br />
            Nenhum dado será perdido. Será implementado na Fase 4.
          </p>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-3">💾 Backup e Exportação</h3>
          <p className="text-xs text-gray-500 mb-3">Exporte todos os dados do sistema para backup.</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">
              📊 Exportar .xlsx
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium hover:bg-gray-50">
              📄 Exportar .json
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">Será implementado na Fase 4.</p>
        </div>

        {/* Admin users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold mb-3">🔑 Administradores</h3>
          <AdminUsersList />
        </div>
      </div>

      {/* New deadline modal */}
      {showNewDeadline && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewDeadline(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Criar Novo Prazo</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ano</label>
                  <input type="number" value={newAno} onChange={e => setNewAno(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Semestre</label>
                  <select value={newSem} onChange={e => setNewSem(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm">
                    <option value={1}>1º Semestre</option>
                    <option value={2}>2º Semestre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Data limite</label>
                <input type="date" value={newData} onChange={e => setNewData(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={newAtraso} onChange={e => setNewAtraso(e.target.checked)} />
                Permitir preenchimento após o prazo
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Ao criar um novo prazo, o prazo anterior será desativado automaticamente.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving || !newData}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'Criando...' : 'Criar Prazo'}
              </button>
              <button onClick={() => setShowNewDeadline(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminUsersList() {
  const [users, setUsers] = useState<{nome: string; cargo: string; email: string}[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('admin_users').select('nome, cargo, email').order('nome')
      if (data) setUsers(data)
    }
    load()
  }, [])

  return (
    <div>
      {users.map((u, i) => (
        <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 text-xs last:border-0">
          <span className="font-medium">{u.nome}</span>
          <span className="text-gray-400">{u.cargo}</span>
        </div>
      ))}
    </div>
  )
}
