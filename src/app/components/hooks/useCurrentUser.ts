// app/components/hooks/useCurrentUser.ts
'use client';
import { useSession } from 'next-auth/react';

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session?.user,
  };
}