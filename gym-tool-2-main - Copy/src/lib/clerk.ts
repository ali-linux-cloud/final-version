import { User } from '@clerk/clerk-react';

export function getUserData(user: User | null) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    name: `${user.firstName} ${user.lastName}`.trim(),
    imageUrl: user.imageUrl,
    isVerified: user.emailAddresses[0]?.verification?.status === 'verified',
  };
}

export function isAdmin(user: User | null) {
  // You can implement your admin check logic here
  // For example, checking if the user's email is in a list of admin emails
  // or checking a publicMetadata field set through the Clerk Dashboard
  return user?.publicMetadata?.role === 'admin';
}
