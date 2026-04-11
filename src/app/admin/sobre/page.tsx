import Logo from '@/components/Logo'
import { BRAND } from '@/lib/constants'

export default function AboutPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-5">
          <Logo size={64} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
          {BRAND.name}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          O {BRAND.name} é um app de gerenciamento de documentos avaliativos
          desenvolvido pela {BRAND.school}.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 text-left mb-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-400">Versão</dt>
            <dd className="font-medium">{BRAND.version}</dd>
            <dt className="text-gray-400">Escola</dt>
            <dd className="font-medium">{BRAND.school}</dd>
            <dt className="text-gray-400">Cidade</dt>
            <dd className="font-medium">{BRAND.city}</dd>
          </dl>
        </div>

        <p className="text-xs text-gray-400">
          Todos os direitos reservados.<br />
          {BRAND.company}
        </p>
      </div>
    </div>
  )
}
