'use client'

/**
 * useAuth — thin adapter over Clerk's useUser so existing consumers
 * (Navbar etc.) keep the same { user, loading } interface they had
 * under Supabase auth.
 */

import { useUser } from '@clerk/nextjs'

type AuthState = {
  user: { id: string; email?: string } | null
  /** true while Clerk is still loading the session */
  loading: boolean
}

export function useAuth(): AuthState {
  const { user, isLoaded } = useUser()
  return {
    user: user
      ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
      : null,
    loading: !isLoaded,
  }
}
