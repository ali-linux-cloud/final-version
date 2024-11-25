-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop everything in the correct order
DROP TABLE IF EXISTS public.subscription_requests CASCADE;
DROP TABLE IF EXISTS public.renewal_requests CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with exact structure matching the TypeScript interface
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    subscription_status TEXT CHECK (subscription_status IN ('pending', 'active', 'cancelled')) DEFAULT 'pending',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    plan_type TEXT CHECK (plan_type IN ('lifetime')) NOT NULL,
    receipt_image TEXT,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription_requests table
CREATE TABLE public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('lifetime')) NOT NULL,
    receipt_image TEXT,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending'
);

-- Create renewal_requests table
CREATE TABLE public.renewal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('lifetime')) NOT NULL,
    receipt_image TEXT,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending'
);

-- Create members table
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    membership_status TEXT CHECK (membership_status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_subscription_requests_user_id ON public.subscription_requests(user_id);
CREATE INDEX idx_renewal_requests_user_id ON public.renewal_requests(user_id);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_email ON public.members(email);