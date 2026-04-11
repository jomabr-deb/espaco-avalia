'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Logo from '@/components/Logo'
import { BRAND } from '@/lib/constants'

const tabs = [
  { id: 'painel', href: '/admin', icon: '📊', label: 'Painel' },
  { id: 'alunos', href: '/admin/alunos', icon: '👶', label: 'Alunos' },
  { id: 'qsi', href: '/admin/qsi', icon: '📝', label: 'QSI' },
  { id: 'docs', href: '/admin/docs', icon: '📁', label: 'Documentos' },
  { id: 'professoras', href: '/admin/professoras', icon: '👩‍🏫', label: 'Professoras' },
  { id: 'config', href: '/admin/config', icon: '⚙️', label: 'Configurações' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userCargo, setUserCargo] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('admin_users')
          .select('nome, cargo')
          .eq('auth_id', user.id)
          .single()
        if (data) {
          setUserName(data.nome)
          setUserCargo(data.cargo)
        }
      }
    }
    loadUser()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const sidebar = (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-[#101828] text-white flex flex-col z-50
        transition-transform duration-200
        w-56
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      <button
        onClick={() => setMenuOpen(false)}
        className="lg:hidden absolute top-3 right-3 text-white/50 hover:text-white text-xl"
      >
        ✕
      </button>

      <div className="px-4 pt-5 pb-6">
        <Logo size={36} />
        <div className="font-serif text-[15px] font-semibold mt-2">{BRAND.name}</div>
        <div className="text-[10px] text-white/30 mt-0.5">{BRAND.school}</div>
      </div>

      <nav className="flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { router.push(tab.href); setMenuOpen(false); }}
            className={`
              w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-left transition
              ${isActive(tab.href)
                ? 'bg-white/[0.08] text-white font-semibold border-l-[3px] border-blue-500'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-l-[3px] border-transparent'
              }
            `}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}

        <button
          onClick={() => { router.push('/admin/sobre'); setMenuOpen(false); }}
          className={`
            w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-left mt-2 transition
            ${pathname === '/admin/sobre'
              ? 'bg-white/[0.08] text-white font-semibold border-l-[3px] border-blue-500'
              : 'text-white/30 hover:text-white/50 border-l-[3px] border-transparent'
            }
          `}
        >
          <span>ℹ️</span> Sobre
        </button>
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.08]">
        <div className="text-xs font-medium">{userName}</div>
        <div className="text-[10px] text-white/40">{userCargo}</div>
        <button
          onClick={handleLogout}
          className="mt-2 text-[11px] bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 rounded transition"
        >
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebar}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 bg-[#101828] text-white px-4 py-2.5 flex items-center gap-3 z-30 lg:hidden">
        <button onClick={() => setMenuOpen(true)} className="text-xl">☰</button>
        <Logo size={28} />
        <span className="font-serif text-sm font-semibold">{BRAND.name}</span>
      </header>

      <main className="lg:ml-56 pt-14 lg:pt-0 p-4 lg:p-7 max-w-[1200px]">
        {children}
      </main>
    </div>
  )
}
