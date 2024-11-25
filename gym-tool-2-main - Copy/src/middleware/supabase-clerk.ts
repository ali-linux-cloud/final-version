import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

export async function updateSupabaseSession() {
  const auth = useAuth();
  
  try {
    // Get the JWT token from Clerk
    const token = await auth.getToken({ template: 'supabase' });
    
    if (token) {
      // Set the Supabase session using the JWT token
      const { error } = await supabase.auth.setSession({
        access_token: token as string,
        refresh_token: '',
      });

      if (error) {
        console.error('Error setting Supabase session:', error.message);
      }
    }
  } catch (error) {
    console.error('Error updating Supabase session:', error);
  }
}
