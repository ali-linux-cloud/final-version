-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable insert for signup" ON public.users;
DROP POLICY IF EXISTS "Enable read access for own data" ON public.users;
DROP POLICY IF EXISTS "Enable update access for own data" ON public.users;
DROP POLICY IF EXISTS "Enable delete access for own data" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for own user data" ON public.users;
DROP POLICY IF EXISTS "Enable update for own user data" ON public.users;

-- Drop policies for subscription_requests
DROP POLICY IF EXISTS "Enable all operations for own requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Enable operations for own requests and admin" ON public.subscription_requests;

-- Drop policies for renewal_requests
DROP POLICY IF EXISTS "Admin can view all renewal requests" ON public.renewal_requests;
DROP POLICY IF EXISTS "Admin can update all renewal requests" ON public.renewal_requests;
DROP POLICY IF EXISTS "Users can view their own renewal requests" ON public.renewal_requests;
DROP POLICY IF EXISTS "Users can create their own renewal requests" ON public.renewal_requests;
DROP POLICY IF EXISTS "Enable operations for own requests and admin" ON public.renewal_requests;

-- Drop policies for members
DROP POLICY IF EXISTS "Members can view their own data" ON public.members;
DROP POLICY IF EXISTS "Admin can view all members" ON public.members;
DROP POLICY IF EXISTS "Enable operations for own data and admin" ON public.members;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Enable insert for signup"
ON public.users
FOR INSERT
WITH CHECK (true);  -- Allow any insert for signup

CREATE POLICY "Enable read access for own user data"
ON public.users
FOR SELECT
USING (
    auth.uid() = id OR 
    (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
);

CREATE POLICY "Enable update for own user data"
ON public.users
FOR UPDATE
USING (
    auth.uid() = id OR 
    (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
)
WITH CHECK (
    auth.uid() = id OR 
    (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
);

-- Policy for subscription_requests table
CREATE POLICY "Enable operations for own requests and admin"
ON public.subscription_requests
FOR ALL
USING (
  auth.uid() = user_id OR 
  (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
);

-- Policies for renewal_requests table
CREATE POLICY "Enable operations for own requests and admin"
ON public.renewal_requests
FOR ALL
USING (
  auth.uid() = user_id OR 
  (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
);

-- Policies for members table
CREATE POLICY "Enable operations for own data and admin"
ON public.members
FOR ALL
USING (
  auth.uid() = user_id OR 
  (auth.jwt() ? 'email' AND auth.jwt()->>'email' = 'admin@saasfactory.com')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.subscription_requests TO authenticated;
GRANT ALL ON public.renewal_requests TO authenticated;
GRANT ALL ON public.members TO authenticated;
