import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET — return current teacher session
export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('teacher_session')
  if (!raw) {
    return NextResponse.json({ session: null }, { status: 401 })
  }
  try {
    const session = JSON.parse(raw.value)
    return NextResponse.json({ session })
  } catch {
    return NextResponse.json({ session: null }, { status: 401 })
  }
}

// POST — login with access code
export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id, nome, email, access_code')
    .eq('access_code', code.toUpperCase())
    .eq('ativo', true)
    .single()

  if (teacherError || !teacher) {
    return NextResponse.json(
      { error: 'Código inválido. Solicite um novo código à direção.' },
      { status: 401 }
    )
  }

  const { data: turmas } = await supabase
    .from('turmas')
    .select('serie, subturma')
    .eq('teacher_id', teacher.id)
    .eq('ano_letivo', new Date().getFullYear())

  await supabase
    .from('teachers')
    .update({ ultimo_acesso: new Date().toISOString() })
    .eq('id', teacher.id)

  const session = {
    teacher_id: teacher.id,
    nome: teacher.nome,
    turmas: turmas || [],
  }

  const cookieStore = await cookies()
  cookieStore.set('teacher_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/',
  })

  return NextResponse.json({ success: true, teacher: { nome: teacher.nome }, turmas })
}

// DELETE — logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('teacher_session')
  return NextResponse.json({ success: true })
}
