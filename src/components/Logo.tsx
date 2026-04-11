'use client'

import Image from 'next/image'

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      <Image
        src="/logo.png"
        alt="Espaço da Criança"
        width={size * 2}
        height={size * 2}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}