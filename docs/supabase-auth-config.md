# Supabase Authentication Configuration

## Enable Leaked Password Protection

Supabase can prevent users from choosing passwords that have been compromised in data breaches by checking against the [HaveIBeenPwned.org](https://haveibeenpwned.com/) database.

### Security Benefit

This feature blocks passwords that:
- Have appeared in known data breaches
- Are commonly used and easily guessable
- Put user accounts at higher risk of compromise

### How to Enable

1. **Open Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Settings** tab

3. **Enable Password Protection**
   - Scroll to **Password Settings** section
   - Find **"Enable leaked password protection"**
   - Toggle it **ON**

4. **Save Changes**
   - Click **Save** at the bottom of the page

### What Happens After Enabling?

- **New signups**: Users will be blocked from choosing compromised passwords with a helpful error message
- **Existing users**: Not affected unless they change their password
- **No performance impact**: Check happens server-side during registration/password change only

### Verification

Once enabled, the Supabase security advisor warning will disappear:
```
✓ Leaked Password Protection Enabled
```

---

**Last Updated:** 2025-10-22
**Migration Related:** This is a dashboard configuration, not a SQL migration
