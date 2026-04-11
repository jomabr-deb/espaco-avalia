import type { Student } from './types'

export function turmaLabel(student: Pick<Student, 'serie' | 'subturma'>): string {
  return student.subturma ? `${student.serie} ${student.subturma}` : student.serie
}

export function calcAge(nascimento: string | null): string {
  if (!nascimento) return ''
  const birth = new Date(nascimento)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years < 1) return `${months}m`
  if (months === 0) return `${years}a`
  return `${years}a ${months}m`
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function deadlineUrgency(daysLeft: number): 'green' | 'amber' | 'red' | 'expired' {
  if (daysLeft <= 0) return 'expired'
  if (daysLeft < 14) return 'red'
  if (daysLeft < 30) return 'amber'
  return 'green'
}
