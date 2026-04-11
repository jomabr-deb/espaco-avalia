import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createAdminClient()

  const [students, teachers, turmas, templates, responses, documents, deadlines, adminUsers] = await Promise.all([
    supabase.from('students').select('*').order('nome'),
    supabase.from('teachers').select('*').order('nome'),
    supabase.from('turmas').select('*'),
    supabase.from('qsi_templates').select('id, serie, semestre, titulo, version, ativo'),
    supabase.from('qsi_responses').select('*'),
    supabase.from('documents').select('*'),
    supabase.from('deadlines').select('*'),
    supabase.from('admin_users').select('nome, cargo, email'),
  ])

  const backup = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    data: {
      students: students.data || [],
      teachers: teachers.data || [],
      turmas: turmas.data || [],
      qsi_templates_meta: templates.data || [],
      qsi_responses: responses.data || [],
      documents: documents.data || [],
      deadlines: deadlines.data || [],
      admin_users: adminUsers.data || [],
    },
    counts: {
      students: students.data?.length || 0,
      teachers: teachers.data?.length || 0,
      qsi_responses: responses.data?.length || 0,
      documents: documents.data?.length || 0,
    },
  }

  const json = JSON.stringify(backup, null, 2)
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="espaco_avalia_backup_${date}.json"`,
    },
  })
}
