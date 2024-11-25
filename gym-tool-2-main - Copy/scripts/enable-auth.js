import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ralpsfqbeqexzmqrwrdw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHBzZnFiZXFleHptcXJ3cmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTkzMTQsImV4cCI6MjA0NzQzNTMxNH0.vLfaWYYG3_QLFOPOalaciqu5Y584blGr3vdME8mmHno'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function enableSignups() {
  try {
    // First, try to sign up a test user to check if signups are enabled
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456',
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: 'Test User'
        }
      }
    })

    if (error) {
      if (error.message.includes('not authorized')) {
        console.log('Please follow these steps to enable signups:')
        console.log('1. Go to https://supabase.com/dashboard')
        console.log('2. Select your project')
        console.log('3. Go to Authentication → Providers')
        console.log('4. Enable "Email" provider')
        console.log('5. Enable "Enable email confirmations"')
        console.log('6. Add your site URL under "Site URL" in Authentication → URL Configuration')
        console.log('   For local development, add: http://localhost:5173')
      } else {
        console.error('Error:', error.message)
      }
      return
    }

    console.log('Signup test successful! Users can now register.')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

enableSignups()
