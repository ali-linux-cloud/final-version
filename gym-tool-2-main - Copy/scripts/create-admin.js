import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ralpsfqbeqexzmqrwrdw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHBzZnFiZXFleHptcXJ3cmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTkzMTQsImV4cCI6MjA0NzQzNTMxNH0.vLfaWYYG3_QLFOPOalaciqu5Y584blGr3vdME8mmHno'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@saasfactory.com',
      password: 'alisaasfactory012$$',
      options: {
        data: {
          name: 'Admin',
          is_verified: true,
          subscription_status: 'active',
          plan_type: 'lifetime'
        }
      }
    })

    if (error) {
      console.error('Error creating admin user:', error.message)
      return
    }

    console.log('Admin user created successfully:', data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

createAdminUser()
