// ═══════════════════════════════════════
// Espaço Avalia — Constants
// ═══════════════════════════════════════

export const BRAND = {
  name: 'Espaço Avalia',
  school: 'Escola Espaço da Criança',
  tagline: 'Sistema de Documentos Avaliativos',
  city: 'Curitiba — PR',
  company: 'EC Atividades Educacionais Ltda.',
  version: '1.0',
}

export const ALL_SERIES = [
  'Berçário',
  'Infantil 1',
  'Infantil 2',
  'Infantil 3',
  'Infantil 4',
  'Infantil 5',
] as const

export const TURMA_COLORS: Record<string, string> = {
  'Berçário': '#f9a8d4',
  'Infantil 1': '#93c5fd',
  'Infantil 2': '#86efac',
  'Infantil 3': '#fcd34d',
  'Infantil 4': '#c4b5fd',
  'Infantil 5': '#fda4af',
}

export const LEVELS = ['NA', 'AP', 'ED', 'C'] as const

export const LEVEL_META = {
  NA: { label: 'Não apresenta', color: '#6b7280', bg: '#f3f4f6' },
  AP: { label: 'Com apoio', color: '#dc2626', bg: '#fee2e2' },
  ED: { label: 'Em desenvolvimento', color: '#d97706', bg: '#fef3c7' },
  C:  { label: 'Consolidado', color: '#16a34a', bg: '#dcfce7' },
} as const

export const STATUS_META = {
  nao_iniciado: { label: 'Não iniciado', color: '#6b7280', bg: '#f3f4f6', icon: '○' },
  rascunho:     { label: 'Rascunho', color: '#d97706', bg: '#fef3c7', icon: '◐' },
  finalizado:   { label: 'Finalizado', color: '#16a34a', bg: '#dcfce7', icon: '●' },
  em_revisao:   { label: 'Em revisão', color: '#2563eb', bg: '#dbeafe', icon: '◉' },
  devolvido:    { label: 'Devolvido', color: '#ea580c', bg: '#ffedd5', icon: '↩' },
  validado:     { label: 'Validado', color: '#0f766e', bg: '#ccfbf1', icon: '✓' },
} as const

export const TURNOS: Record<string, string> = {
  'I': 'Integral',
  'T': 'Tarde',
  'TA': 'Turno Ampliado',
  'M': 'Manhã',
}

export const DOC_TYPES = ['PD', 'Estudo de Caso', 'PAEE', 'PEI'] as const
