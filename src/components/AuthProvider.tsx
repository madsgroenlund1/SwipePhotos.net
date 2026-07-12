'use client'

/**
 * AuthProvider — single source of truth for client-side auth state.
 *
 * The root layout (server component) calls getUser() and passes the
 * result here as `initialUser`.  All client components read auth state
 * through `useAuth()` — no need to prop-drill initialLoggedIn.
 *
 * Why this fixes the "Sign in" flash on refresh:
 *   Without this, each page passes `initialLoggedIn` to <Navbar>, and the
 *   Navbar's onAuthStateChange INITIAL_SESSION event can fire with null
 *   (before the browser finishes reading the refreshed cookie), momentarily
 *   overriding the server-confirmed state.  By initialising user state here
 *   from the server and skipping INITIAL_SESSION when the server already
 *   confirmed the session, we eliminate that race.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthState = {
  user: User | null
  /** true while the client is reconciling with the server state */
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  // Seed from server — no loading flash for users who are already authenticated.
  const [user, setUser]       = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)
  // Track whether server confirmed a session so we can be smart about INITIAL_SESSION.
  const serverConfirmed = useRef(initialUser !== null)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session) {
          // Browser confirmed the session — all good.
          setUser(session.user)
          setLoading(false)
        } else if (serverConfirmed.current) {
          // Server said logged-in but INITIAL_SESSION is null.
          // This happens when the middleware refreshed the access token and
          // wrote new cookie chunks in the response, but the browser client
          // hasn't re-read them yet (timing race with chunked cookie writes).
          // Verify directly against Supabase — one lightweight API call.
          supabase.auth.getUser().then(({ data: { user: verifiedUser } }) => {
            setUser(verifiedUser ?? null)
            setLoading(false)
          })
        } else {
          // Neither server nor browser sees a session — definitively logged out.
          setUser(null)
          setLoading(false)
        }
        return
      }

      // All other events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED):
      // update immediately and trust the event.
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
