import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// POST: parse XLS and return matching results
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]

  // Find header row (look for "Nome do aluno")
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i].map(c => String(c).trim())
    if (row.some(c => c.includes('Nome do aluno') || c.includes('Nome'))) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    return NextResponse.json({ error: 'Formato não reconhecido. Cabeçalho "Nome do aluno" não encontrado.' }, { status: 400 })
  }

  // Parse students from XLS
  // Expected columns (by position from ERP export):
  // 0: Nome, 2: Serie, 4: Turma (ex: "Infantil 3A - TA"), 7: Periodo,
  // 8: Resp.F nome, 9: Resp.F cel, 10: Resp.F email,
  // 11: Resp.P nome, 13: Resp.P cel, 14: Resp.P email
  const imported: ImportedStudent[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const nome = String(row[0] || '').trim()
    if (!nome || nome.includes('/')) continue // skip empty or date rows

    const serie = String(row[2] || '').trim()
    const turmaFull = String(row[4] || '').trim()

    // Parse turma: "Infantil 3A - TA" → subturma="A", turno="TA"
    const parts = turmaFull.split(' - ')
    const turno = parts[1]?.trim() || ''
    const turmaCode = parts[0]?.trim() || ''
    const subturma = turmaCode.length > 0 && 'AB'.includes(turmaCode[turmaCode.length - 1])
      ? turmaCode[turmaCode.length - 1] : ''

    const serieClean = serie || (subturma
      ? turmaCode.slice(0, -1).trim()
      : turmaCode)

    imported.push({
      nome,
      nome_normalized: normalize(nome),
      serie: serieClean,
      subturma: subturma || null,
      turno: turno || null,
      resp_fin_nome: String(row[8] || '').trim() || null,
      resp_fin_celular: String(row[9] || '').trim() || null,
      resp_fin_email: String(row[10] || '').trim() || null,
      resp_ped_nome: String(row[11] || '').trim() || null,
      resp_ped_celular: String(row[13] || '').trim() || null,
      resp_ped_email: String(row[14] || '').trim() || null,
    })
  }

  // Fetch existing students
  const supabase = createAdminClient()
  const { data: existing } = await supabase.from('students').select('*').eq('ativo', true)

  // Match
  const results: MatchResult[] = imported.map(imp => {
    const match = (existing || []).find(ex => normalize(ex.nome) === imp.nome_normalized)

    if (!match) {
      return { action: 'novo' as const, imported: imp, existing: null, changes: [] }
    }

    const changes: Change[] = []
    if (match.serie !== imp.serie) changes.push({ field: 'serie', label: 'Série', old: match.serie, new: imp.serie })
    if ((match.subturma || '') !== (imp.subturma || '')) changes.push({ field: 'subturma', label: 'Subturma', old: match.subturma || '', new: imp.subturma || '' })
    if ((match.turno || '') !== (imp.turno || '')) changes.push({ field: 'turno', label: 'Turno', old: match.turno || '', new: imp.turno || '' })
    if (imp.resp_fin_nome && match.resp_fin_nome !== imp.resp_fin_nome) changes.push({ field: 'resp_fin_nome', label: 'Resp. Financeiro', old: match.resp_fin_nome || '', new: imp.resp_fin_nome })
    if (imp.resp_ped_nome && match.resp_ped_nome !== imp.resp_ped_nome) changes.push({ field: 'resp_ped_nome', label: 'Resp. Pedagógico', old: match.resp_ped_nome || '', new: imp.resp_ped_nome })
    if (imp.resp_fin_celular && match.resp_fin_celular !== imp.resp_fin_celular) changes.push({ field: 'resp_fin_celular', label: 'Cel. Resp. Fin.', old: match.resp_fin_celular || '', new: imp.resp_fin_celular })
    if (imp.resp_ped_celular && match.resp_ped_celular !== imp.resp_ped_celular) changes.push({ field: 'resp_ped_celular', label: 'Cel. Resp. Ped.', old: match.resp_ped_celular || '', new: imp.resp_ped_celular })
    if (imp.resp_fin_email && match.resp_fin_email !== imp.resp_fin_email) changes.push({ field: 'resp_fin_email', label: 'Email Resp. Fin.', old: match.resp_fin_email || '', new: imp.resp_fin_email })
    if (imp.resp_ped_email && match.resp_ped_email !== imp.resp_ped_email) changes.push({ field: 'resp_ped_email', label: 'Email Resp. Ped.', old: match.resp_ped_email || '', new: imp.resp_ped_email })

    if (changes.length === 0) {
      return { action: 'identico' as const, imported: imp, existing: match, changes: [] }
    }

    return { action: 'atualizar' as const, imported: imp, existing: match, changes }
  })

  // Find missing (in DB but not in import)
  const importedNames = new Set(imported.map(i => i.nome_normalized))
  const missing = (existing || []).filter(ex => !importedNames.has(normalize(ex.nome)))

  return NextResponse.json({
    results,
    missing: missing.map(m => ({ id: m.id, nome: m.nome, serie: m.serie, subturma: m.subturma })),
    summary: {
      total: imported.length,
      identicos: results.filter(r => r.action === 'identico').length,
      atualizar: results.filter(r => r.action === 'atualizar').length,
      novos: results.filter(r => r.action === 'novo').length,
      ausentes: missing.length,
    }
  })
}

// PUT: apply confirmed changes
export async function PUT(request: NextRequest) {
  const { updates, inserts, deactivations } = await request.json()
  const supabase = createAdminClient()
  let updatedCount = 0, insertedCount = 0, deactivatedCount = 0

  // Apply updates
  for (const upd of updates || []) {
    const { id, fields } = upd
    await supabase.from('students').update(fields).eq('id', id)
    updatedCount++
  }

  // Insert new students
  for (const ins of inserts || []) {
    await supabase.from('students').insert(ins)
    insertedCount++
  }

  // Deactivate
  for (const id of deactivations || []) {
    await supabase.from('students').update({
      ativo: false,
      desativado_em: new Date().toISOString(),
      desativado_motivo: 'Ausente na importação do ERP',
    }).eq('id', id)
    deactivatedCount++
  }

  return NextResponse.json({
    success: true,
    summary: { updated: updatedCount, inserted: insertedCount, deactivated: deactivatedCount }
  })
}

interface ImportedStudent {
  nome: string; nome_normalized: string; serie: string;
  subturma: string | null; turno: string | null;
  resp_fin_nome: string | null; resp_fin_celular: string | null; resp_fin_email: string | null;
  resp_ped_nome: string | null; resp_ped_celular: string | null; resp_ped_email: string | null;
}

interface Change { field: string; label: string; old: string; new: string }
interface MatchResult {
  action: 'identico' | 'atualizar' | 'novo';
  imported: ImportedStudent;
  existing: Record<string, unknown> | null;
  changes: Change[];
}
