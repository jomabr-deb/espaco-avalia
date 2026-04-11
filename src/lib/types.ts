// ═══════════════════════════════════════
// Espaço Avalia — Type Definitions
// ═══════════════════════════════════════

export interface Student {
  id: string
  nome: string
  nascimento: string | null
  serie: string
  subturma: string | null
  turno: string | null
  resp_fin_nome: string | null
  resp_fin_celular: string | null
  resp_fin_email: string | null
  resp_ped_nome: string | null
  resp_ped_celular: string | null
  resp_ped_email: string | null
  inclusao: boolean
  ativo: boolean
  desativado_em: string | null
  desativado_motivo: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  nome: string
  cpf: string | null
  matricula: string | null
  email: string | null
  data_admissao: string | null
  access_code: string | null
  ativo: boolean
  ultimo_acesso: string | null
  created_at: string
  updated_at: string
}

export interface Turma {
  id: string
  serie: string
  subturma: string | null
  ano_letivo: number
  teacher_id: string | null
}

export interface AdminUser {
  id: string
  auth_id: string
  nome: string
  cargo: string
  email: string
  ativo: boolean
}

export interface QsiTemplate {
  id: string
  serie: string
  semestre: number
  titulo: string
  subtitulo: string | null
  sections: QsiSection[]
  version: number
  ativo: boolean
}

export interface QsiSection {
  title: string
  bncc: string
  checklist: string[]
  prompts: string[]
}

export type QsiStatus =
  | 'nao_iniciado'
  | 'rascunho'
  | 'finalizado'
  | 'em_revisao'
  | 'devolvido'
  | 'validado'

export interface QsiResponse {
  id: string
  student_id: string
  template_id: string
  teacher_id: string | null
  ano_letivo: number
  semestre: number
  status: QsiStatus
  checklist_data: Record<string, string>  // "secIdx_itemIdx" → "NA"|"AP"|"ED"|"C"
  text_data: Record<string, string>       // "secIdx_promptIdx" → "texto..."
  observacao_direcao: string | null
  finalizado_em: string | null
  validado_em: string | null
  validado_por: string | null
  created_at: string
  updated_at: string
}

export interface Deadline {
  id: string
  ano: number
  semestre: number
  data_limite: string
  ativo: boolean
  permitir_atraso: boolean
}

export interface Document {
  id: string
  student_id: string
  tipo: 'PD' | 'Estudo de Caso' | 'PAEE' | 'PEI'
  titulo: string
  data_documento: string
  semestre_ref: number | null
  ano_ref: number | null
  storage_path: string
  uploaded_by: string | null
  uploaded_at: string
  observacoes: string | null
}

// Session types
export interface TeacherSession {
  teacher_id: string
  nome: string
  turmas: { serie: string; subturma: string | null }[]
}

export interface AdminSession {
  user_id: string
  nome: string
  cargo: string
  email: string
}
