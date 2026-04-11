'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useTeacherSession } from '@/lib/hooks'
import { TURMA_COLORS } from '@/lib/constants'
import { turmaLabel, formatDate } from '@/lib/utils'
import type { Student } from '@/lib/types'

interface DocRecord {
  id: string
  tipo: string
  titulo: string
  data_documento: string
  student_id: string
}

export default function TeacherDocs() {
  const { session, loading: sessionLoading } = useTeacherSession()
  const [students, setStudents] = useState<Student[]>([])
  const [docs, setDocs] = useState<Record<string, DocRecord[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading || !session) return

    async function load() {
      const supabase = createClient()

      // Get students
      let allStudents: Student[] = []
      for (const turma of session!.turmas) {
        let query = supabase
          .from('students')
          .select('*')
          .eq('serie', turma.serie)
          .eq('ativo', true)
          .order('nome')
        if (turma.subturma) query = query.eq('subturma', turma.subturma)
        const { data } = await query
        if (data) allStudents = [...allStudents, ...data]
      }
      setStudents(allStudents)

      // Get documents for these students
      if (allStudents.length > 0) {
        const studentIds = allStudents.map(s => s.id)
        const { data: docData } = await supabase
          .from('documents')
          .select('*')
          .in('student_id', studentIds)
          .order('data_documento', { ascending: false })

        if (docData) {
          const map: Record<string, DocRecord[]> = {}
          docData.forEach(d => {
            if (!map[d.student_id]) map[d.student_id] = []
            map[d.student_id].push(d)
          })
          setDocs(map)
        }
      }

      setLoading(false)
    }
    load()
  }, [session, sessionLoading])

  if (loading || sessionLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
  }

  return (
    <div className="p-5">
      <a href="/professora" className="text-sm text-gray-400 hover:text-gray-600 no-underline">← Voltar</a>
      <h2 className="font-serif text-lg font-bold text-gray-900 mt-2 mb-4">Documentos dos Alunos</h2>

      {students.map(s => {
        const studentDocs = docs[s.id] || []
        return (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                style={{ background: TURMA_COLORS[s.serie] || '#e2e8f0' }}
              >
                {s.nome.charAt(0)}
              </div>
              <div>
                <div className="text-[13px] font-medium text-gray-900">{s.nome}</div>
                <div className="text-[11px] text-gray-400">{turmaLabel(s)}</div>
              </div>
            </div>

            {studentDocs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {studentDocs.map(d => (
                  <span
                    key={d.id}
                    className="text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100 transition"
                  >
                    📄 {d.tipo} — {formatDate(d.data_documento)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-300 mt-1">Nenhum documento disponível</p>
            )}

            {s.inclusao && studentDocs.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-500">
                  📋 Documentos de inclusão serão importados pela direção
                </span>
              </div>
            )}
          </div>
        )
      })}

      {students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum aluno atribuído à sua turma.</p>
        </div>
      )}
    </div>
  )
}
