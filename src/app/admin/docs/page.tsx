'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { adminAction } from '@/lib/admin-actions'
import { ALL_SERIES, TURMA_COLORS, DOC_TYPES } from '@/lib/constants'
import { turmaLabel, formatDate } from '@/lib/utils'
import type { Student } from '@/lib/types'

interface DocRecord {
  id: string; student_id: string; tipo: string; titulo: string;
  data_documento: string; storage_path: string; uploaded_at: string
}

export default function DocsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [docs, setDocs] = useState<DocRecord[]>([])
  const [filterType, setFilterType] = useState('Todos')
  const [filterSerie, setFilterSerie] = useState('Todas')
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)

  // Upload form state
  const [uploadStudentId, setUploadStudentId] = useState('')
  const [uploadTipo, setUploadTipo] = useState('PD')
  const [uploadData, setUploadData] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data: studs } = await supabase.from('students').select('*').eq('ativo', true).order('nome')
    const { data: docData } = await supabase.from('documents').select('*').order('data_documento', { ascending: false })
    if (studs) setStudents(studs)
    if (docData) setDocs(docData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload() {
    if (!uploadFile || !uploadStudentId || !uploadData) return
    setUploading(true)

    const supabase = createClient()
    const student = students.find(s => s.id === uploadStudentId)
    const fileName = `${Date.now()}_${uploadFile.name}`
    const path = `${uploadStudentId}/${fileName}`

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .upload(path, uploadFile)

    if (storageError) {
      alert('Erro ao fazer upload: ' + storageError.message)
      setUploading(false)
      return
    }

    // Insert metadata
    const titulo = `${uploadTipo} — ${student?.nome || ''}`
    const { error: dbError } = await supabase.from('documents').insert({
      student_id: uploadStudentId,
      tipo: uploadTipo,
      titulo,
      data_documento: uploadData,
      storage_path: path,
    })

    if (dbError) {
      alert('Erro ao salvar metadados: ' + dbError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    setShowUpload(false)
    setUploadFile(null)
    setUploadStudentId('')
    setUploadData('')
    load()
  }

  async function handleDelete(doc: DocRecord) {
    if (!confirm('Excluir este documento?')) return
    const supabase = createClient()
    await supabase.storage.from('documentos').remove([doc.storage_path])
    await adminAction('delete_document', { id: doc.id })
    load()
  }

  // Group docs by student
  const studentMap = new Map(students.map(s => [s.id, s]))
  const filteredDocs = docs.filter(d => {
    if (filterType !== 'Todos' && d.tipo !== filterType) return false
    if (filterSerie !== 'Todas') {
      const s = studentMap.get(d.student_id)
      if (s && s.serie !== filterSerie) return false
    }
    return true
  })

  // Group by student for display
  const docsByStudent: Record<string, DocRecord[]> = {}
  filteredDocs.forEach(d => {
    if (!docsByStudent[d.student_id]) docsByStudent[d.student_id] = []
    docsByStudent[d.student_id].push(d)
  })

  // Students that have docs (or inclusion students)
  const displayStudents = students.filter(s => {
    if (filterSerie !== 'Todas' && s.serie !== filterSerie) return false
    return docsByStudent[s.id] || s.inclusao
  })

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Documentos</h1>
        <button onClick={() => setShowUpload(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
          📤 Importar Documento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {['Todos', ...DOC_TYPES].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-[11px] border cursor-pointer transition ${
                filterType === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
              }`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todas', ...ALL_SERIES].map(s => (
            <button key={s} onClick={() => setFilterSerie(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] border cursor-pointer transition ${
                filterSerie === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Document cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {displayStudents.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{background: TURMA_COLORS[s.serie]}}>{s.nome.charAt(0)}</div>
              <div>
                <div className="text-xs font-semibold">{s.nome}</div>
                <div className="text-[10px] text-gray-400">{turmaLabel(s)} {s.inclusao && '· Inclusão'}</div>
              </div>
            </div>

            {docsByStudent[s.id]?.length > 0 ? (
              docsByStudent[s.id].map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-1 text-[11px]">
                  <span>📄 {d.tipo} — {formatDate(d.data_documento)}</span>
                  <div className="flex gap-1">
                    <button className="text-blue-600 hover:underline">Abrir</button>
                    <button onClick={() => handleDelete(d)} className="text-red-400 hover:underline">✕</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-gray-300 text-center py-2">Nenhum documento</p>
            )}
          </div>
        ))}
      </div>

      {displayStudents.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum documento encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Importar Documento</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Aluno</label>
                <select value={uploadStudentId} onChange={e => setUploadStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm">
                  <option value="">Selecione...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.nome} — {turmaLabel(s)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                  <select value={uploadTipo} onChange={e => setUploadTipo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Data do documento</label>
                  <input type="date" value={uploadData} onChange={e => setUploadData(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Arquivo (PDF ou DOCX)</label>
                <input type="file" accept=".pdf,.docx"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadStudentId || !uploadData}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                {uploading ? 'Enviando...' : '📤 Enviar'}
              </button>
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
