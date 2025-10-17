// app/components/hooks/useCurrentUser.ts
'use client'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

type UserProfile = {
  // Optionnel, adapte selon ce que tu mets dans le user de la session !
  name?: string | null
  type?: string | null
  available?: boolean | null
  created_at?: string
}

type User = Session['user'] & { profile?: UserProfile }

export function useCurrentUser() {
  const { data, status } = useSession()

  const user = data?.user as User | null

  return {
    user,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!user,
  }
}
