-- Drop triggers first
DROP TRIGGER IF EXISTS log_subscription_status_trigger ON users;
DROP TRIGGER IF EXISTS update_members_modtime ON members;
DROP TRIGGER IF EXISTS check_subscription_expiry_trigger ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions next
DROP FUNCTION IF EXISTS get_active_subscriptions();
DROP FUNCTION IF EXISTS process_subscription_request(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS log_subscription_status_change();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS check_subscription_expiry();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop existing tables if they exist
DROP TABLE IF EXISTS renewal_history;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS subscription_requests;
DROP TABLE IF EXISTS subscription_status_logs;
DROP TABLE IF EXISTS users;

-- Drop existing types if they exist
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS request_status;
DROP TYPE IF EXISTS membership_status;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE membership_status AS ENUM ('active', 'expired', 'suspended');

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_status subscription_status DEFAULT 'pending',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  receipt_image TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the subscription requests table
CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  phone_number TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  receipt_image TEXT NOT NULL,
  status request_status DEFAULT 'pending',
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_date TIMESTAMP WITH TIME ZONE
);

-- Create a table to log subscription status changes
CREATE TABLE IF NOT EXISTS subscription_status_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  old_status subscription_status,
  new_status subscription_status,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the members table
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    membership_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status membership_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Create the renewal history table
CREATE TABLE IF NOT EXISTS renewal_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    membership_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on member_id for better query performance
CREATE INDEX IF NOT EXISTS idx_renewal_history_member_id ON renewal_history(member_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_members_modtime
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to log subscription status changes
CREATE OR REPLACE FUNCTION log_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
    INSERT INTO subscription_status_logs (user_id, old_status, new_status)
    VALUES (NEW.id, OLD.subscription_status, NEW.subscription_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to log subscription status changes
CREATE TRIGGER log_subscription_status_trigger
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION log_subscription_status_change();

-- Create or replace the function to process subscription requests
CREATE OR REPLACE FUNCTION process_subscription_request(
  p_user_id UUID,
  p_approved BOOLEAN
) RETURNS void AS $$
DECLARE
  v_plan_type TEXT;
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_user RECORD;
  v_old_status subscription_status;
BEGIN
  -- Get the user first to check if they exist and store old status
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with ID %', p_user_id;
  END IF;
  
  -- Store the old status before any updates
  v_old_status := v_user.subscription_status;

  -- Get the plan type from the subscription request
  SELECT plan_type INTO v_plan_type
  FROM subscription_requests
  WHERE user_id = p_user_id AND status = 'pending'::request_status
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending subscription request found for user %', p_user_id;
  END IF;

  -- Set the start date to now
  v_start_date := CURRENT_TIMESTAMP;

  -- Calculate end date based on plan type
  v_end_date := CASE
    WHEN v_plan_type = 'monthly' THEN v_start_date + INTERVAL '30 days'
    WHEN v_plan_type = 'yearly' THEN v_start_date + INTERVAL '365 days'
    WHEN v_plan_type = 'lifetime' THEN v_start_date + INTERVAL '100 years'
    ELSE v_start_date + INTERVAL '30 days'
  END;

  -- Update user subscription details
  IF p_approved THEN
    UPDATE users
    SET is_verified = TRUE,
        subscription_status = 'active'::subscription_status,
        subscription_start_date = v_start_date,
        subscription_end_date = v_end_date,
        plan_type = v_plan_type
    WHERE id = p_user_id;

    -- Double check the update
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    IF v_user.subscription_status != 'active'::subscription_status OR NOT v_user.is_verified THEN
      RAISE EXCEPTION 'Failed to update user status to active';
    END IF;
  ELSE
    UPDATE users
    SET is_verified = FALSE,
        subscription_status = 'rejected'::subscription_status
    WHERE id = p_user_id;
  END IF;

  -- Update request status
  UPDATE subscription_requests
  SET status = CASE 
        WHEN p_approved THEN 'approved'::request_status 
        ELSE 'rejected'::request_status 
      END,
      processed_date = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND status = 'pending'::request_status;

  -- Log the status change using the stored old status
  INSERT INTO subscription_status_logs (user_id, old_status, new_status)
  VALUES (p_user_id, 
          v_old_status,
          CASE WHEN p_approved THEN 'active'::subscription_status ELSE 'rejected'::subscription_status END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active subscriptions
CREATE OR REPLACE FUNCTION get_active_subscriptions()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  phone_number TEXT,
  subscription_status subscription_status,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  plan_type TEXT,
  submission_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.phone_number,
    u.subscription_status,
    u.subscription_start_date,
    u.subscription_end_date,
    u.plan_type,
    u.submission_date
  FROM users u
  WHERE u.is_verified = TRUE 
    AND u.subscription_status = 'active'::subscription_status
    AND (u.subscription_end_date > CURRENT_TIMESTAMP OR u.plan_type = 'lifetime')
  ORDER BY u.submission_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if subscription has expired
  IF NEW.subscription_end_date <= CURRENT_TIMESTAMP AND NEW.subscription_status = 'active'::subscription_status THEN
    NEW.subscription_status := 'expired'::subscription_status;
    
    -- Log the status change
    INSERT INTO subscription_status_logs (user_id, old_status, new_status)
    VALUES (NEW.id, 'active'::subscription_status, 'expired'::subscription_status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription expiry
CREATE TRIGGER check_subscription_expiry_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_subscription_expiry();

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is the admin user
  IF NEW.email = 'admin@saasfactory.com' THEN
    RETURN NEW;
  END IF;

  -- Insert into public.users table with default values
  INSERT INTO public.users (
    id,
    email,
    name,
    is_verified,
    subscription_status,
    plan_type,
    submission_date
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    FALSE,
    'pending',
    NULL,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If the user already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.jwt()->>'email' = 'admin@saasfactory.com'
  );

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.jwt()->>'email' = 'admin@saasfactory.com'
  );

-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own members" ON members;
DROP POLICY IF EXISTS "Users can insert their own members" ON members;
DROP POLICY IF EXISTS "Users can update their own members" ON members;
DROP POLICY IF EXISTS "Users can delete their own members" ON members;

-- Create RLS policies for members table
CREATE POLICY "Users can view their own members" 
  ON members FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'admin@saasfactory.com'
    )
  );

CREATE POLICY "Users can insert their own members" 
  ON members FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'admin@saasfactory.com'
    )
  );

CREATE POLICY "Users can update their own members" 
  ON members FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'admin@saasfactory.com'
    )
  );

CREATE POLICY "Users can delete their own members" 
  ON members FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'admin@saasfactory.com'
    )
  );

-- Enable RLS on renewal_history table
ALTER TABLE renewal_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their members renewal history" ON renewal_history;
DROP POLICY IF EXISTS "Users can insert their members renewal history" ON renewal_history;

-- Create RLS policies for renewal_history table
CREATE POLICY "Users can view their members renewal history" 
  ON renewal_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.id = renewal_history.member_id 
      AND (
        members.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.email = 'admin@saasfactory.com'
        )
      )
    )
  );

CREATE POLICY "Users can insert their members renewal history" 
  ON renewal_history FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.id = renewal_history.member_id 
      AND (
        members.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.email = 'admin@saasfactory.com'
        )
      )
    )
  );
