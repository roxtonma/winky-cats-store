'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const previousUserIdRef = useRef<string | null>(null)

  // Fetch user profile from database - fail fast for better UX
  const fetchUserProfile = async (userId: string): Promise<void> => {
    const TIMEOUT_MS = 2000 // Fail fast: 2 seconds max

    console.log('[AuthContext] fetchUserProfile started for userId:', userId)

    // Create an AbortController for query cancellation
    const abortController = new AbortController()

    // Create a timeout promise that also cancels the request
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        abortController.abort()
        reject(new Error(`Profile fetch timeout after ${TIMEOUT_MS}ms`))
      }, TIMEOUT_MS)
    })

    // Create the fetch promise
    const fetchPromise = async () => {
      try {
        console.log('[AuthContext] Executing Supabase query to user_profiles table...')
        console.log('[AuthContext] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

        const startTime = Date.now()
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle() // Use maybeSingle() instead of single() - returns null if no row, doesn't error
        const elapsed = Date.now() - startTime

        console.log('[AuthContext] Supabase query completed in', elapsed, 'ms:', { hasData: !!data, error: error?.message })

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet
            console.log('[AuthContext] User profile not found (PGRST116) - needs to complete setup')
            setUserProfile(null)
            return
          }
          if (error.code === '42P01') {
            // Table doesn't exist
            console.error('[AuthContext] ERROR: user_profiles table does not exist (42P01). Please run migrations!')
            console.error('[AuthContext] Run: supabase migration up OR execute migrations/*.sql files')
            setUserProfile(null)
            return
          }
          console.error('[AuthContext] Error fetching user profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })

          // Fail fast - don't retry, just assume no profile
          console.warn('[AuthContext] Assuming no profile exists, proceeding without retry')
          setUserProfile(null)
          return
        }

        // With maybeSingle(), data will be null if no row exists (not an error)
        if (!data) {
          console.log('[AuthContext] No user profile found - needs to complete setup')
          setUserProfile(null)
          return
        }

        console.log('[AuthContext] User profile loaded successfully:', data.name)
        setUserProfile(data)
      } catch (error) {
        // Check if this is an AbortError from timeout
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[AuthContext] Query was aborted due to timeout - assuming no profile')
        } else {
          console.error('[AuthContext] Unexpected error in fetchPromise:', error)
        }

        // Fail fast - assume no profile exists
        setUserProfile(null)
      }
    }

    // Race between fetch and timeout
    try {
      await Promise.race([fetchPromise(), timeoutPromise])
    } catch {
      console.warn('[AuthContext] Profile fetch failed or timed out (2s) - assuming no profile exists')
      // Fail fast - don't retry, just assume no profile
      setUserProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  useEffect(() => {
    console.log('[AuthContext] Initializing auth...')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session:', session?.user?.email || 'no session')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchUserProfile(session.user.id)
          .catch((error) => {
            console.error('[AuthContext] Initial profile fetch error:', error)
          })
          .finally(() => {
            console.log('[AuthContext] Initial loading complete, setting loading=false')
            setLoading(false)
          })
      } else {
        console.log('[AuthContext] No session, setting loading=false')
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.email || 'no user')
      const currentUserId = session?.user?.id ?? null
      const userChanged = currentUserId !== previousUserIdRef.current

      console.log('[AuthContext] User changed?', userChanged, '(prev:', previousUserIdRef.current, 'current:', currentUserId, ')')

      setSession(session)
      setUser(session?.user ?? null)
      previousUserIdRef.current = currentUserId

      if (session?.user) {
        // Only set loading=true if the user actually changed (login/logout/switch accounts)
        // For same user (navigation, session revalidation), keep UI responsive
        if (userChanged) {
          console.log('[AuthContext] User changed, setting loading=true and fetching profile...')
          setLoading(true)
        } else {
          console.log('[AuthContext] Same user, revalidating profile in background (keeping loading=false)...')
        }

        try {
          await fetchUserProfile(session.user.id)
        } catch (error) {
          console.error('[AuthContext] Exception in profile fetch:', error)
        } finally {
          if (userChanged) {
            console.log('[AuthContext] Profile fetch complete, setting loading=false')
            setLoading(false)
          } else {
            console.log('[AuthContext] Background profile revalidation complete')
          }
        }
      } else {
        setUserProfile(null)
        console.log('[AuthContext] No user, setting loading=false')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    console.log('[AuthContext] signInWithMagicLink called for:', email)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('[AuthContext] Magic link error:', error)
        return { error }
      }

      console.log('[AuthContext] Magic link sent successfully')
      return { error: null }
    } catch (error) {
      console.error('[AuthContext] Exception during magic link:', error)
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async () => {
    console.log('[AuthContext] signInWithGoogle called')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('[AuthContext] signInWithGoogle error:', error)
        return { error }
      }

      console.log('[AuthContext] signInWithGoogle initiated, redirecting to Google...')
      // The redirect happens automatically via signInWithOAuth
      return { error: null }
    } catch (error) {
      console.error('[AuthContext] Exception during signInWithGoogle:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    console.log('[AuthContext] signOut called')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[AuthContext] signOut error:', error)
        throw error
      }
      console.log('[AuthContext] signOut successful')
      setUserProfile(null)
    } catch (error) {
      console.error('[AuthContext] Exception during signOut:', error)
      // Even if signOut fails, clear local state
      setUserProfile(null)
      setUser(null)
      setSession(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        session,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
