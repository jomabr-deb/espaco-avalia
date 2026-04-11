'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Change { field: string; label: string; old: string; new: string }
interface MatchResult {
  action: 'identico' | 'atualizar' | 'novo'
  imported: Record<string, unknown>
  existing: Record<string, unknown> | null
  changes: Change[]
  selected?: boolean
  selectedChanges?: Record<string, boolean>
}
interface MissingStudent { id: string; nome: string; serie: string; subturma: string | null }
interface Summary { total: number; identicos: number; atualizar: number; novos: number; ausentes: number }

export default function ImportarPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'review' | 'confirm' | 'done'>('upload')
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [missing, setMissing] = useState<MissingStudent[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [deactivateIds, setDeactivateIds] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [finalSummary, setFinalSummary] = useState<{ updated: number; inserted: number; deactivated: number } | null>(null)
  const [error, setError] = useState('')

  // Step 1: Upload
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/import-students', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setUploading(false); return }

      // Initialize selection: new students selected by default, updates with all changes selected
      const initialized = data.results.map((r: MatchResult) => ({
        ...r,
        selected: r.action === 'novo',
        selectedChanges: r.changes?.reduce((acc: Record<string, boolean>, c: Change) => {
          acc[c.field] = true; return acc
        }, {}) || {},
      }))

      setResults(initialized)
      setMissing(data.missing)
      setSummary(data.summary)
      setStep('review')
    } catch {
      setError('Erro ao processar arquivo.')
    }
    setUploading(false)
  }

  // Step 3: Apply
  async function handleApply() {
    setApplying(true)

    // Build updates: students with selected changes
    const updates = results
      .filter(r => r.action === 'atualizar' && r.existing)
      .map(r => {
        const fields: Record<string, unknown> = {}
        r.changes.forEach(c => {
          if (r.selectedChanges?.[c.field]) {
            fields[c.field] = c.new || null
          }
        })
        if (Object.keys(fields).length === 0) return null
        return { id: (r.existing as Record<string, unknown>).id, fields }
      })
      .filter(Boolean)

    // Build inserts: selected new students
    const inserts = results
      .filter(r => r.action === 'novo' && r.selected)
      .map(r => {
        const imp = r.imported
        return {
          nome: imp.nome, serie: imp.serie, subturma: imp.subturma, turno: imp.turno,
          resp_fin_nome: imp.resp_fin_nome, resp_fin_celular: imp.resp_fin_celular,
          resp_fin_email: imp.resp_fin_email, resp_ped_nome: imp.resp_ped_nome,
          resp_ped_celular: imp.resp_ped_celular, resp_ped_email: imp.resp_ped_email,
        }
      })

    const deactivations = Array.from(deactivateIds)

    const res = await fetch('/api/import-students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, inserts, deactivations }),
    })
    const data = await res.json()
    setFinalSummary(data.summary)
    setApplying(false)
    setStep('done')
  }

  const updatesWithChanges = results.filter(r => r.action === 'atualizar' &&
    r.changes.some(c => r.selectedChanges?.[c.field]))
  const newSelected = results.filter(r => r.action === 'novo' && r.selected)

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push('/admin/alunos')} className="text-sm text-gray-400 hover:text-gray-600">← Voltar</button>
        <h1 className="font-serif text-xl font-bold text-gray-900">Importar Alunos do ERP</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Upload', 'Conciliação', 'Confirmação', 'Concluído'].map((label, i) => {
          const steps = ['upload', 'review', 'confirm', 'done']
          const current = steps.indexOf(step)
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>{i + 1}</div>
              <span className={`text-xs ${i <= current ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
              {i < 3 && <div className={`w-8 h-0.5 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">📥</div>
          <h3 className="font-semibold mb-2">Selecione o arquivo do ERP</h3>
          <p className="text-xs text-gray-500 mb-4">Arquivo .xls com a listagem de alunos exportada do sistema.</p>
          <label className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition">
            {uploading ? 'Processando...' : 'Escolher Arquivo'}
            <input type="file" accept=".xls,.xlsx" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* STEP 2: Review */}
      {step === 'review' && summary && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <SumCard value={summary.identicos} label="Sem alterações" color="text-green-600" bg="bg-green-50" />
            <SumCard value={summary.atualizar} label="Com mudanças" color="text-amber-600" bg="bg-amber-50" />
            <SumCard value={summary.novos} label="Novos alunos" color="text-blue-600" bg="bg-blue-50" />
            <SumCard value={summary.ausentes} label="Ausentes no arquivo" color="text-red-500" bg="bg-red-50" />
          </div>

          {/* Updates */}
          {results.filter(r => r.action === 'atualizar').length > 0 && (
            <Section title="🔄 Alunos com mudanças" subtitle="Selecione quais campos atualizar" color="border-amber-300">
              {results.filter(r => r.action === 'atualizar').map((r, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
                  <div className="font-medium text-sm mb-2">{r.imported.nome as string}</div>
                  {r.changes.map(c => (
                    <label key={c.field} className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                      <input type="checkbox"
                        checked={r.selectedChanges?.[c.field] ?? true}
                        onChange={() => {
                          const updated = [...results]
                          const idx = results.indexOf(r)
                          updated[idx] = {
                            ...r,
                            selectedChanges: { ...r.selectedChanges, [c.field]: !r.selectedChanges?.[c.field] }
                          }
                          setResults(updated)
                        }} />
                      <span className="text-gray-500 w-28">{c.label}:</span>
                      <span className="text-red-400 line-through">{c.old || '(vazio)'}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-green-600 font-medium">{c.new || '(vazio)'}</span>
                    </label>
                  ))}
                </div>
              ))}
            </Section>
          )}

          {/* New students */}
          {results.filter(r => r.action === 'novo').length > 0 && (
            <Section title="🆕 Alunos novos" subtitle="Selecione quais importar" color="border-blue-300">
              {results.filter(r => r.action === 'novo').map((r, i) => (
                <label key={i} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-3 mb-1 cursor-pointer text-sm">
                  <input type="checkbox" checked={r.selected ?? true}
                    onChange={() => {
                      const updated = [...results]
                      const idx = results.indexOf(r)
                      updated[idx] = { ...r, selected: !r.selected }
                      setResults(updated)
                    }} />
                  <span className="font-medium">{r.imported.nome as string}</span>
                  <span className="text-gray-400 text-xs">{r.imported.serie as string} {r.imported.subturma as string}</span>
                </label>
              ))}
            </Section>
          )}

          {/* Missing */}
          {missing.length > 0 && (
            <Section title="⚠️ Ausentes na importação" subtitle="Alunos no sistema que não constam no arquivo" color="border-red-300">
              {missing.map(m => (
                <label key={m.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-3 mb-1 cursor-pointer text-sm">
                  <input type="checkbox" checked={deactivateIds.has(m.id)}
                    onChange={() => {
                      const next = new Set(deactivateIds)
                      next.has(m.id) ? next.delete(m.id) : next.add(m.id)
                      setDeactivateIds(next)
                    }} />
                  <span>{m.nome}</span>
                  <span className="text-gray-400 text-xs">{m.serie} {m.subturma || ''}</span>
                  <span className="text-[10px] text-red-400 ml-auto">Desativar</span>
                </label>
              ))}
            </Section>
          )}

          {/* Identical (collapsible) */}
          {results.filter(r => r.action === 'identico').length > 0 && (
            <details className="mb-6">
              <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                ✓ {results.filter(r => r.action === 'identico').length} alunos sem alterações
              </summary>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
                {results.filter(r => r.action === 'identico').map((r, i) => (
                  <div key={i} className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">{r.imported.nome as string}</div>
                ))}
              </div>
            </details>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep('confirm')}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              Revisar e Confirmar →
            </button>
            <button onClick={() => setStep('upload')} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm">
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === 'confirm' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto">
          <h3 className="font-semibold mb-4">Confirmar Operação</h3>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Alunos a atualizar:</span>
              <span className="font-semibold text-amber-600">{updatesWithChanges.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Alunos novos a importar:</span>
              <span className="font-semibold text-blue-600">{newSelected.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Alunos a desativar:</span>
              <span className="font-semibold text-red-500">{deactivateIds.size}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">Nenhum dado será perdido. Alunos desativados permanecem no sistema com histórico preservado.</p>
          <div className="flex gap-2">
            <button onClick={handleApply} disabled={applying}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
              {applying ? 'Aplicando...' : '✓ Confirmar e Aplicar'}
            </button>
            <button onClick={() => setStep('review')} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm">
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && finalSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-lg mb-4">Importação Concluída</h3>
          <div className="space-y-1 text-sm mb-6">
            <p><span className="font-semibold text-amber-600">{finalSummary.updated}</span> alunos atualizados</p>
            <p><span className="font-semibold text-blue-600">{finalSummary.inserted}</span> alunos importados</p>
            <p><span className="font-semibold text-red-500">{finalSummary.deactivated}</span> alunos desativados</p>
          </div>
          <button onClick={() => router.push('/admin/alunos')}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold">
            Ir para Alunos
          </button>
        </div>
      )}
    </div>
  )
}

function SumCard({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${bg}`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function Section({ title, subtitle, color, children }: {
  title: string; subtitle: string; color: string; children: React.ReactNode
}) {
  return (
    <div className={`mb-6 border-l-4 ${color} pl-4`}>
      <h3 className="font-semibold text-sm mb-0.5">{title}</h3>
      <p className="text-[11px] text-gray-400 mb-3">{subtitle}</p>
      {children}
    </div>
  )
}
