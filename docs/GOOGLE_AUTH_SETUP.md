# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for your Winky Cats Store application.

## Prerequisites

- A Google Cloud Platform account
- Access to your Supabase project dashboard
- Your application running locally or deployed

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name: `Winky Cats Store`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes (required):
   - `openid` (add manually)
   - `.../auth/userinfo.email` (default)
   - `.../auth/userinfo.profile` (default)
5. Save and continue

### 1.3 Create OAuth 2.0 Client ID
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application** as the application type
4. Configure the OAuth client:
   - **Name**: `Winky Cats Store Web Client`

   - **Authorized JavaScript origins**:
     - For local development: `http://localhost:3000`
     - For production: `https://yourdomain.com`

   - **Authorized redirect URIs**:
     - For local development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
     - **IMPORTANT**: Also add your Supabase callback URL (found in Step 2.2)

5. Click **Create**
6. **Save your Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Supabase Dashboard Setup

### 2.1 Enable Google Provider
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand

### 2.2 Configure Google Provider
1. Enable the Google provider (toggle switch)
2. Enter your **Client ID** from Step 1.3
3. Enter your **Client Secret** from Step 1.3
4. Copy the **Callback URL** shown (format: `https://[your-project-ref].supabase.co/auth/v1/callback`)
5. **Go back to Google Cloud Console** and add this callback URL to your Authorized redirect URIs (Step 1.3)
6. Save changes in Supabase

### 2.3 Configure URL Settings
1. In Supabase, go to **Authentication** > **URL Configuration**
2. Add your site URL:
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. Add redirect URLs (wildcard pattern):
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**`

## Step 3: Verify Implementation

### 3.1 Code Files Created
The following files have been created/modified for Google OAuth:

- ✅ `src/lib/supabase-server.ts` - Server-side Supabase client
- ✅ `src/app/auth/callback/route.ts` - OAuth callback handler
- ✅ `src/contexts/AuthContext.tsx` - Added `signInWithGoogle()` function
- ✅ `src/app/login/page.tsx` - Added Google sign-in button
- ✅ `src/app/signup/page.tsx` - Added Google sign-in button

### 3.2 Test the Flow
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. You should be redirected to Google's sign-in page
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Common Issues

**"redirect_uri_mismatch" error:**
- Make sure the redirect URI in Google Cloud Console exactly matches your callback URL
- Check for typos, missing slashes, or http vs https mismatches

**"Access blocked" error:**
- Verify your OAuth consent screen is properly configured
- Make sure you've added the required scopes
- If using External user type, add your email as a test user during development

**User redirected but not signed in:**
- Check browser console for errors
- Verify the callback route (`/auth/callback`) is working
- Check Supabase logs in the dashboard

**"Invalid credentials" in Supabase:**
- Double-check your Client ID and Client Secret in Supabase settings
- Make sure you copied them correctly from Google Cloud Console

### Debug Mode

Enable console logging to debug:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `[OAuth Callback]` or `[AuthContext]`

## Production Deployment

Before deploying to production:

1. **Update Google Cloud Console:**
   - Add your production domain to Authorized JavaScript origins
   - Add your production callback URL to Authorized redirect URIs

2. **Update Supabase:**
   - Add your production URL to Site URL
   - Add production redirect URL pattern

3. **Publish OAuth Consent Screen:**
   - Submit your app for verification if needed
   - Remove test user restrictions

4. **Environment Variables:**
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in production

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for sensitive credentials
- Regularly rotate your OAuth credentials
- Monitor authentication logs in Supabase dashboard
- Consider implementing rate limiting for authentication endpoints

## Additional Resources

- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Server-Side Auth with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
