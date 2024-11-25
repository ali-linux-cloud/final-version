import type { User } from '../types/auth';

export function isValidUser(user: any): user is User {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.isVerified === 'boolean' &&
    typeof user.submissionDate === 'string' &&
    typeof user.isAdmin === 'boolean' &&  // Ensure isAdmin is always a boolean
    (user.subscriptionStatus === 'pending' ||
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'expired' ||
      user.subscriptionStatus === 'rejected') &&
    (user.planType === 'monthly' ||
      user.planType === 'yearly' ||
      user.planType === 'lifetime')
  );
}
