import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageBreak,
} from 'docx'

const LEVEL_LABELS: Record<string, string> = {
  NA: 'Não apresenta', AP: 'Com apoio', ED: 'Em desenvolvimento', C: 'Consolidado', '': '—',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const responseId = searchParams.get('id')
  if (!responseId) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  const supabase = createAdminClient()

  // Load response
  const { data: resp } = await supabase.from('qsi_responses').select('*').eq('id', responseId).single()
  if (!resp) return NextResponse.json({ error: 'QSI não encontrado' }, { status: 404 })

  // Load student
  const { data: student } = await supabase.from('students').select('*').eq('id', resp.student_id).single()
  if (!student) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  // Load template
  const { data: template } = await supabase.from('qsi_templates').select('*').eq('id', resp.template_id).single()
  if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

  const turma = student.subturma ? `${student.serie} ${student.subturma}` : student.serie
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  const borders = { top: border, bottom: border, left: border, right: border }
  const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 }

  // Build document content
  const children: (Paragraph | Table)[] = []

  // Title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'QUESTIONÁRIO DE SONDAGEM', bold: true, size: 28, font: 'Arial' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: template.titulo, size: 22, font: 'Arial', color: '444444' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: `${resp.semestre}º Semestre — ${resp.ano_letivo}`, size: 20, font: 'Arial', color: '666666' })],
  }))

  // Student info table
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders, margins: cellMargins, width: { size: 4680, type: WidthType.DXA },
          shading: { fill: 'DEEAF1', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: `Aluno: ${student.nome}`, size: 20, font: 'Arial' })] })],
        }),
        new TableCell({ borders, margins: cellMargins, width: { size: 4680, type: WidthType.DXA },
          shading: { fill: 'DEEAF1', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: `Turma: ${turma}`, size: 20, font: 'Arial' })] })],
        }),
      ]}),
    ],
  }))

  children.push(new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }))

  // Sections
  const sections = template.sections as { title: string; bncc: string; checklist: string[]; prompts: string[] }[]

  sections.forEach((section, secIdx) => {
    // Section title
    children.push(new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: section.title, bold: true, size: 24, font: 'Arial', color: '2E75B6' })],
    }))

    if (section.bncc) {
      children.push(new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: section.bncc, size: 16, font: 'Arial', color: '888888', italics: true })],
      }))
    }

    // Checklist table
    if (section.checklist.length > 0) {
      const headerRow = new TableRow({ children: [
        new TableCell({ borders, margins: cellMargins, width: { size: 6800, type: WidthType.DXA },
          shading: { fill: 'D5E8F0', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Habilidade / Comportamento', bold: true, size: 18, font: 'Arial' })] })],
        }),
        ...['NA', 'AP', 'ED', 'C'].map(l => new TableCell({
          borders, margins: cellMargins, width: { size: 640, type: WidthType.DXA },
          shading: { fill: 'D5E8F0', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: l, bold: true, size: 16, font: 'Arial' })] })],
        })),
      ]})

      const dataRows = section.checklist.map((item, idx) => {
        const val = (resp.checklist_data as Record<string, string>)?.[`${secIdx}_${idx}`] || ''
        return new TableRow({ children: [
          new TableCell({ borders, margins: cellMargins, width: { size: 6800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: item, size: 18, font: 'Arial' })] })],
          }),
          ...['NA', 'AP', 'ED', 'C'].map(l => new TableCell({
            borders, margins: cellMargins, width: { size: 640, type: WidthType.DXA },
            shading: val === l ? { fill: l === 'C' ? 'DCFCE7' : l === 'ED' ? 'FEF3C7' : l === 'AP' ? 'FEE2E2' : 'F3F4F6', type: ShadingType.CLEAR } : undefined,
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: val === l ? '✓' : '', size: 18, font: 'Arial' })] })],
          })),
        ]})
      })

      children.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6800, 640, 640, 640, 640],
        rows: [headerRow, ...dataRows],
      }))
    }

    // Text responses
    section.prompts.forEach((prompt, pIdx) => {
      const val = (resp.text_data as Record<string, string>)?.[`${secIdx}_${pIdx}`] || ''
      if (val) {
        children.push(new Paragraph({
          spacing: { before: 150, after: 50 },
          children: [new TextRun({ text: prompt, bold: true, size: 18, font: 'Arial', color: '555555' })],
        }))
        children.push(new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: val, size: 20, font: 'Arial' })],
        }))
      }
    })
  })

  // Generate DOCX
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        }
      },
      children,
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  const fileName = `QSI_${resp.ano_letivo}_${resp.semestre}Sem_${student.nome.replace(/\s+/g, '_')}.docx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
