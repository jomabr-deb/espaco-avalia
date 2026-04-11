'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useTeacherSession } from '@/lib/hooks'
import StatusBadge from '@/components/StatusBadge'
import { TURMA_COLORS } from '@/lib/constants'
import { turmaLabel } from '@/lib/utils'
import type { Student, QsiResponse, QsiTemplate, Deadline, QsiStatus } from '@/lib/types'

export default function QsiStudentList() {
  const { session, loading: sessionLoading } = useTeacherSession()
  const [students, setStudents] = useState<Student[]>([])
  const [responses, setResponses] = useState<Record<string, QsiResponse>>({})
  const [templates, setTemplates] = useState<Record<string, QsiTemplate>>({})
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (sessionLoading || !session) return

    async function load() {
      const supabase = createClient()

      // Get active deadline
      const { data: dl } = await supabase
        .from('deadlines').select('*').eq('ativo', true).single()
      if (dl) setDeadline(dl)
      const sem = dl?.semestre ?? 1
      const ano = dl?.ano ?? new Date().getFullYear()

      // Get students for this teacher's turmas
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

      // Get existing QSI responses for these students
      if (allStudents.length > 0) {
        const studentIds = allStudents.map(s => s.id)
        const { data: resps } = await supabase
          .from('qsi_responses')
          .select('*')
          .in('student_id', studentIds)
          .eq('semestre', sem)
          .eq('ano_letivo', ano)

        if (resps) {
          const map: Record<string, QsiResponse> = {}
          resps.forEach(r => { map[r.student_id] = r })
          setResponses(map)
        }
      }

      // Get templates (for progress calculation)
      const { data: tmpls } = await supabase
        .from('qsi_templates')
        .select('*')
        .eq('semestre', sem)
        .eq('ativo', true)
      if (tmpls) {
        const map: Record<string, QsiTemplate> = {}
        tmpls.forEach(t => { map[t.serie] = t })
        setTemplates(map)
      }

      setLoading(false)
    }
    load()
  }, [session, sessionLoading])

  function getProgress(student: Student): number {
    const resp = responses[student.id]
    const tmpl = templates[student.serie]
    if (!resp || !tmpl) return 0
    const totalChecks = tmpl.sections.reduce((a, s) => a + s.checklist.length, 0)
    if (totalChecks === 0) return 0
    const filled = Object.keys(resp.checklist_data || {}).length
    return Math.round((filled / totalChecks) * 100)
  }

  function getStatus(student: Student): QsiStatus {
    return responses[student.id]?.status ?? 'nao_iniciado'
  }

  if (loading || sessionLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
  }

  // Group students by turma
  const groups: Record<string, Student[]> = {}
  students.forEach(s => {
    const key = turmaLabel(s)
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  })

  return (
    <div className="p-5">
      <a href="/professora" className="text-sm text-gray-400 hover:text-gray-600 no-underline">← Voltar</a>
      <h2 className="font-serif text-lg font-bold text-gray-900 mt-2 mb-4">
        Selecione o aluno
      </h2>

      {Object.entries(groups).map(([turma, studs]) => (
        <div key={turma} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: TURMA_COLORS[studs[0]?.serie] || '#ccc' }}
            />
            <span className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
              {turma}
            </span>
          </div>

          {studs.map(s => {
            const status = getStatus(s)
            const progress = getProgress(s)

            return (
              <button
                key={s.id}
                onClick={() => router.push(`/professora/qsi/${s.id}`)}
                className="w-full bg-white border rounded-xl p-3 mb-1.5 flex items-center gap-3
                           text-left hover:bg-gray-50 transition"
                style={{
                  borderColor: status === 'devolvido' ? '#fb923c' : '#e8ecf1',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{ background: TURMA_COLORS[s.serie] || '#e2e8f0', color: '#1a2332' }}
                >
                  {s.nome.charAt(0)}
                </div>

                {/* Name + info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">
                    {s.nome}
                    {s.inclusao && (
                      <span className="ml-1.5 text-[9px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded align-middle">
                        INCLUSÃO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400">{s.turno}</div>
                </div>

                {/* Status / Progress */}
                <div className="shrink-0 text-right">
                  {status === 'nao_iniciado' ? (
                    <span className="text-[11px] text-gray-400">Não iniciado</span>
                  ) : status === 'finalizado' || status === 'validado' || status === 'em_revisao' ? (
                    <StatusBadge status={status} />
                  ) : (
                    <div>
                      {status === 'devolvido' && <StatusBadge status={status} />}
                      {status === 'rascunho' && (
                        <>
                          <div className="w-12 h-1 bg-gray-200 rounded-full">
                            <div
                              className="h-1 bg-amber-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-amber-500">{progress}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}

      {students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum aluno atribuído à sua turma.</p>
        </div>
      )}
    </div>
  )
}
