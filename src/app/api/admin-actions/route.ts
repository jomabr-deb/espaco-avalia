import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...params } = body
  const supabase = createAdminClient()

  try {
    switch (action) {
      // ── STUDENTS ──
      case 'update_student': {
        const { id, ...fields } = params
        const { error } = await supabase.from('students').update(fields).eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }
      case 'deactivate_student': {
        const { error } = await supabase.from('students').update({
          ativo: false,
          desativado_em: new Date().toISOString(),
          desativado_motivo: params.motivo || 'Desativado pela direção',
        }).eq('id', params.id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }
      case 'reactivate_student': {
        const { error } = await supabase.from('students').update({
          ativo: true, desativado_em: null, desativado_motivo: null,
        }).eq('id', params.id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      // ── QSI STATUS ──
      case 'qsi_change_status': {
        const update: Record<string, unknown> = { status: params.newStatus }
        if (params.newStatus === 'devolvido') update.observacao_direcao = params.obs || ''
        if (params.newStatus === 'validado') update.validado_em = new Date().toISOString()
        const { error } = await supabase.from('qsi_responses').update(update).eq('id', params.id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      // ── TEACHERS ──
      case 'update_teacher': {
        const { id, ...fields } = params
        const { error } = await supabase.from('teachers').update(fields).eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }
      case 'regenerate_code': {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
        const { error } = await supabase.from('teachers').update({ access_code: code }).eq('id', params.id)
        if (error) throw error
        return NextResponse.json({ success: true, code })
      }

      // ── DEADLINES ──
      case 'create_deadline': {
        // Deactivate current active deadline
        await supabase.from('deadlines').update({ ativo: false }).eq('ativo', true)
        const { error } = await supabase.from('deadlines').insert({
          ano: params.ano,
          semestre: params.semestre,
          data_limite: params.data_limite,
          ativo: true,
          permitir_atraso: params.permitir_atraso || false,
        })
        if (error) throw error
        return NextResponse.json({ success: true })
      }
      case 'update_deadline': {
        const { id, ...fields } = params
        const { error } = await supabase.from('deadlines').update(fields).eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      // ── DOCUMENTS ──
      case 'delete_document': {
        const { error } = await supabase.from('documents').delete().eq('id', params.id)
        if (error) throw error
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
