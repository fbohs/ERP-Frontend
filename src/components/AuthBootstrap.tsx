'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function AuthBootstrap() {
  const rehydrate = useAuthStore((s) => s.rehydrate)
  useEffect(() => { rehydrate() }, [rehydrate])
  return null
}
