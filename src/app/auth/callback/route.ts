import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional: Get the 'next' parameter to redirect after auth
  const next = searchParams.get('next') ?? '/'

  console.log('[OAuth Callback] Received callback with code:', !!code)

  if (code) {
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[OAuth Callback] Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      console.log('[OAuth Callback] Successfully exchanged code for session')

      // Successful authentication, redirect to the next page or account
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('[OAuth Callback] Exception during code exchange:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_exception`)
    }
  }

  console.warn('[OAuth Callback] No code parameter found')
  // No code found, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
