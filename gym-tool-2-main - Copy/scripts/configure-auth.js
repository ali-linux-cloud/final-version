import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ralpsfqbeqexzmqrwrdw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHBzZnFiZXFleHptcXJ3cmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTkzMTQsImV4cCI6MjA0NzQzNTMxNH0.vLfaWYYG3_QLFOPOalaciqu5Y584blGr3vdME8mmHno'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function configureAuth() {
  try {
    // Note: This operation requires admin privileges
    const { data, error } = await supabase.auth.admin.updateConfig({
      email: {
        allowed_domains: ['*']  // Allow all email domains
      }
    })

    if (error) {
      console.error('Error configuring auth:', error.message)
      return
    }

    console.log('Auth configuration updated successfully:', data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

configureAuth()
