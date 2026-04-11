'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Logo from '@/components/Logo'
import { BRAND } from '@/lib/constants'

export default function LoginPage() {
  const [mode, setMode] = useState<null | 'teacher' | 'admin'>(null)
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAdminLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/admin')
  }

  async function handleTeacherLogin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/teacher-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Código inválido.')
        setLoading(false)
        return
      }
      router.push('/professora')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <Logo size={80} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-1">
          {BRAND.name}
        </h1>
        <p className="text-gray-400 text-sm mb-10">{BRAND.tagline}</p>

        {!mode && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('teacher')}
              className="w-full py-3.5 px-6 rounded-xl bg-gray-900 text-white font-medium
                         flex items-center justify-center gap-3 hover:bg-gray-800 transition"
            >
              <span className="text-xl">👩‍🏫</span> Acesso Professora
            </button>
            <button
              onClick={() => setMode('admin')}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-gray-900 font-medium
                         border border-gray-200 flex items-center justify-center gap-3
                         hover:bg-gray-50 transition"
            >
              <span className="text-xl">🏫</span> Direção / Coordenação
            </button>
          </div>
        )}

        {mode === 'teacher' && (
          <div>
            <p className="text-sm text-gray-500 mb-3">Digite seu código de acesso:</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleTeacherLogin()}
              maxLength={6}
              placeholder="Ex: MEL637"
              className="w-full py-3 px-4 rounded-lg border border-gray-200 text-center
                         text-xl font-bold tracking-[0.3em] uppercase
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleTeacherLogin}
              disabled={loading || code.length < 6}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold
                         hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              onClick={() => { setMode(null); setError(''); setCode(''); }}
              className="mt-4 text-gray-400 text-sm hover:text-gray-600 transition"
            >
              ← Voltar
            </button>
            <p className="text-xs text-gray-400 mt-6">
              Código fornecido pela direção da escola.<br />
              Caso tenha perdido, solicite um novo.
            </p>
          </div>
        )}

        {mode === 'admin' && (
          <div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full py-3 px-4 rounded-lg border border-gray-200 mb-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Senha"
              type="password"
              className="w-full py-3 px-4 rounded-lg border border-gray-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleAdminLogin}
              disabled={loading || !email || !pw}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold
                         hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              onClick={() => { setMode(null); setError(''); setEmail(''); setPw(''); }}
              className="mt-4 text-gray-400 text-sm hover:text-gray-600 transition"
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
