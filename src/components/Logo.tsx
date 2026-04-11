'use client'

import Image from 'next/image'

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Espaço da Criança"
      width={size}
      height={size}
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  )
}