'use client'

import { useState, useEffect } from 'react'
import type { TeacherSession } from '@/lib/types'

export function useTeacherSession() {
  const [session, setSession] = useState<TeacherSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/teacher-auth')
        if (res.ok) {
          const data = await res.json()
          setSession(data.session)
        }
      } catch {
        // Will be caught by middleware
      }
      setLoading(false)
    }
    load()
  }, [])

  return { session, loading }
}
