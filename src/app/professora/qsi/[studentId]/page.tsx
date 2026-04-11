'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useTeacherSession } from '@/lib/hooks'
import { LEVELS, LEVEL_META, TURMA_COLORS } from '@/lib/constants'
import { turmaLabel } from '@/lib/utils'
import type { Student, QsiTemplate, QsiResponse, Deadline } from '@/lib/types'

export default function QsiFormPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const router = useRouter()
  const { session } = useTeacherSession()

  const [student, setStudent] = useState<Student | null>(null)
  const [template, setTemplate] = useState<QsiTemplate | null>(null)
  const [deadline, setDeadline] = useState<Deadline | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<Record<string, string>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string>('nao_iniciado')
  const [obsDir, setObsDir] = useState<string>('')
  const [secIdx, setSecIdx] = useState(0)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [loading, setLoading] = useState(true)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const checklistRef = useRef(checklist)
  const textsRef = useRef(texts)
  const statusRef = useRef(status)
  const responseIdRef = useRef(responseId)
  checklistRef.current = checklist
  textsRef.current = texts
  statusRef.current = status
  responseIdRef.current = responseId

  // Load data
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Student
      const { data: s } = await supabase
        .from('students').select('*').eq('id', studentId).single()
      if (!s) { router.push('/professora/qsi'); return }
      setStudent(s)

      // Deadline
      const { data: dl } = await supabase
        .from('deadlines').select('*').eq('ativo', true).single()
      if (dl) setDeadline(dl)
      const sem = dl?.semestre ?? 1
      const ano = dl?.ano ?? new Date().getFullYear()

      // Template
      const { data: tmpl } = await supabase
        .from('qsi_templates')
        .select('*')
        .eq('serie', s.serie)
        .eq('semestre', sem)
        .eq('ativo', true)
        .single()
      if (tmpl) setTemplate(tmpl)

      // Existing response
      const { data: resp } = await supabase
        .from('qsi_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('semestre', sem)
        .eq('ano_letivo', ano)
        .single()

      if (resp) {
        setResponseId(resp.id)
        setChecklist(resp.checklist_data || {})
        setTexts(resp.text_data || {})
        setStatus(resp.status)
        setObsDir(resp.observacao_direcao || '')
      }

      setLoading(false)
    }
    load()
  }, [studentId, router])

  // Autosave function
  const doSave = useCallback(async () => {
    if (!student || !template || !deadline || !session) return
    setSaveState('saving')

    const supabase = createClient()
    const currentStatus = statusRef.current === 'nao_iniciado' ? 'rascunho'
      : statusRef.current === 'devolvido' ? 'rascunho'
      : statusRef.current

    const payload = {
      student_id: student.id,
      template_id: template.id,
      teacher_id: session.teacher_id,
      ano_letivo: deadline.ano,
      semestre: deadline.semestre,
      status: currentStatus,
      checklist_data: checklistRef.current,
      text_data: textsRef.current,
    }

    if (responseIdRef.current) {
      // Update
      await supabase
        .from('qsi_responses')
        .update(payload)
        .eq('id', responseIdRef.current)
    } else {
      // Insert
      const { data } = await supabase
        .from('qsi_responses')
        .insert(payload)
        .select('id')
        .single()
      if (data) {
        setResponseId(data.id)
        responseIdRef.current = data.id
      }
    }

    setStatus(currentStatus)
    statusRef.current = currentStatus
    setSaveState('saved')
  }, [student, template, deadline, session])

  // Debounced save
  function triggerSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState('saving')
    saveTimerRef.current = setTimeout(() => doSave(), 2000)
  }

  // Handlers
  function handleCheck(itemIdx: number, value: string) {
    if (isLocked) return
    const key = `${secIdx}_${itemIdx}`
    setChecklist(prev => ({ ...prev, [key]: value }))
    triggerSave()
  }

  function handleText(promptIdx: number, value: string) {
    if (isLocked) return
    const key = `${secIdx}_${promptIdx}`
    setTexts(prev => ({ ...prev, [key]: value }))
    triggerSave()
  }

  async function handleFinalize() {
    // Save immediately with finalized status
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const supabase = createClient()
    const payload = {
      status: 'finalizado',
      checklist_data: checklist,
      text_data: texts,
      finalizado_em: new Date().toISOString(),
    }

    if (responseId) {
      await supabase.from('qsi_responses').update(payload).eq('id', responseId)
    }

    router.push('/professora/qsi')
  }

  // Derived state
  const isLocked = status === 'finalizado' || status === 'em_revisao' || status === 'validado'
  const section = template?.sections[secIdx]
  const totalSections = template?.sections.length ?? 0
  const totalChecks = template?.sections.reduce((a, s) => a + s.checklist.length, 0) ?? 0
  const filledChecks = Object.keys(checklist).length
  const progress = totalChecks > 0 ? Math.round((filledChecks / totalChecks) * 100) : 0

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
  }

  if (!template) {
    return (
      <div className="p-5">
        <a href="/professora/qsi" className="text-sm text-gray-400 hover:text-gray-600 no-underline">← Voltar</a>
        <div className="bg-amber-50 rounded-xl p-5 mt-3">
          <p className="text-sm text-amber-800">
            ⚠️ O modelo QSI para <strong>{student?.serie}</strong> ainda não está disponível.
          </p>
          <p className="text-xs text-amber-700 mt-2">
            Verifique se o template foi carregado na tabela qsi_templates do Supabase.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Student header */}
      <div className="px-5 py-3 bg-white border-b border-gray-200">
        <a href="/professora/qsi" className="text-[13px] text-gray-400 hover:text-gray-600 no-underline">
          ← Voltar aos alunos
        </a>

        {/* Devolvido banner */}
        {status === 'devolvido' && obsDir && (
          <div className="bg-orange-50 rounded-lg p-2.5 mt-2 text-[12px] text-orange-800">
            ↩ <strong>Devolvido pela coordenação:</strong> {obsDir}
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: TURMA_COLORS[student?.serie ?? ''] || '#e2e8f0' }}
          >
            {student?.nome.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-gray-900">{student?.nome}</div>
            <div className="text-[11px] text-gray-400">
              {student && turmaLabel(student)} · QSI {deadline?.semestre}º Sem
            </div>
          </div>
          <span className="text-[11px] font-medium" style={{
            color: saveState === 'saving' ? '#2563eb' : saveState === 'saved' ? '#16a34a' : '#9ca3af'
          }}>
            {saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? '✓ Salvo' : ''}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? '#16a34a' : '#2563eb',
              }}
            />
          </div>
          <span className="text-[11px] text-gray-400 font-medium">{progress}%</span>
        </div>
      </div>

      {/* Section dots */}
      <div className="px-5 py-2 bg-gray-50 flex gap-1 overflow-x-auto items-center">
        {template.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setSecIdx(i)}
            className="shrink-0 rounded-full border-none cursor-pointer transition-all"
            style={{
              width: i === secIdx ? 20 : 7,
              height: 7,
              background: i === secIdx ? '#2563eb' : i < secIdx ? '#93c5fd' : '#cbd5e1',
            }}
          />
        ))}
        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
          {secIdx + 1}/{totalSections}
        </span>
      </div>

      {/* Section content */}
      {section && (
        <div className="px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1">{section.title}</h3>
          {section.bncc && (
            <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">📋 {section.bncc}</p>
          )}

          {/* Checklist */}
          {section.checklist.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 mb-2 flex-wrap">
                {LEVELS.map(l => (
                  <span key={l} className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_META[l].color }} />
                    {l}
                  </span>
                ))}
              </div>

              {section.checklist.map((item, idx) => {
                const val = checklist[`${secIdx}_${idx}`]
                return (
                  <div key={idx} className="bg-white rounded-lg p-3 mb-1.5 border border-gray-200">
                    <div className="text-[13px] text-gray-800 mb-2 leading-relaxed">{item}</div>
                    <div className="flex gap-1">
                      {LEVELS.map(l => (
                        <button
                          key={l}
                          onClick={() => handleCheck(idx, l)}
                          disabled={isLocked}
                          className="flex-1 py-1.5 rounded-md text-xs font-semibold border-none
                                     cursor-pointer transition-all disabled:cursor-not-allowed"
                          style={{
                            background: val === l ? LEVEL_META[l].color : '#f1f5f9',
                            color: val === l ? '#fff' : '#9ca3af',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Text prompts */}
          {section.prompts.map((prompt, idx) => (
            <div key={idx} className="mb-3">
              <label className="text-xs font-medium text-gray-500 block mb-1">{prompt}</label>
              <textarea
                value={texts[`${secIdx}_${idx}`] || ''}
                onChange={e => handleText(idx, e.target.value)}
                disabled={isLocked}
                placeholder="Digite aqui..."
                className="w-full min-h-[70px] p-3 rounded-lg border border-gray-200 text-[13px]
                           resize-y leading-relaxed disabled:bg-gray-50 disabled:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]
                      bg-white border-t border-gray-200 px-4 py-2.5 flex gap-2 z-50">
        <button
          disabled={secIdx === 0}
          onClick={() => setSecIdx(secIdx - 1)}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 bg-white
                     text-[13px] font-medium disabled:text-gray-300 disabled:cursor-not-allowed
                     hover:bg-gray-50 transition"
        >
          ← Anterior
        </button>

        {secIdx < totalSections - 1 ? (
          <button
            onClick={() => setSecIdx(secIdx + 1)}
            className="flex-1 py-2.5 rounded-lg border-none bg-gray-900 text-white
                       text-[13px] font-semibold cursor-pointer hover:bg-gray-800 transition"
          >
            Próximo →
          </button>
        ) : !isLocked ? (
          <button
            onClick={handleFinalize}
            className="flex-1 py-2.5 rounded-lg border-none bg-blue-600 text-white
                       text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition"
          >
            ✓ Finalizar QSI
          </button>
        ) : (
          <button
            disabled
            className="flex-1 py-2.5 rounded-lg border border-gray-200 bg-gray-50
                       text-[13px] text-gray-400 font-medium"
          >
            {status === 'finalizado' ? '● Finalizado' :
             status === 'validado' ? '✓ Validado' : '◉ Em revisão'}
          </button>
        )}
      </div>
    </div>
  )
}
