import type { User as ClerkUser } from "@clerk/types";
export type User = ClerkUser;

export interface SubscriptionRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_type: 'monthly' | 'yearly' | 'lifetime';
  receipt_image: string;
  submission_date: string;
  processed_date?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface RenewalRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: 'monthly' | 'yearly' | 'lifetime';
  receipt_image: string;
  submission_date: string;
  processed_date?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type AuthResponse = {
  user: User | null;
  error: Error | null;
};

export type AuthError = Error;

// Database response types
export interface DbUser {
  id: string;
  email: string;
  name: string;
  phone_number: string | null;
  is_verified: boolean;
  subscription_status: 'pending' | 'active' | 'expired' | 'rejected';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  plan_type: 'monthly' | 'yearly' | 'lifetime';
  receipt_image: string | null;
  submission_date: string;
  is_admin: boolean;
}