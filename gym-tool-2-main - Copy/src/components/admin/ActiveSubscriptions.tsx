import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Loader } from 'lucide-react';
import type { User } from '../../types/auth';
import { supabase } from '../../lib/supabase';
import toast from '../../utils/toast';

export default function ActiveSubscriptions() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      // Simple query first to check data
      const { data: simpleData, error: simpleError } = await supabase
        .from('users')
        .select('*');
      
      console.log('All users:', simpleData);
      
      if (simpleError) {
        console.error('Error fetching all users:', simpleError);
        throw simpleError;
      }

      // Now try the filtered query
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_verified', true)
        .eq('subscription_status', 'active');

      console.log('Filtered users:', data);
      
      if (error) {
        console.error('Error in filtered query:', error);
        throw error;
      }

      // Map the data
      const mappedUsers = data?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phone_number,
        isVerified: user.is_verified,
        subscriptionStatus: user.subscription_status,
        subscriptionStartDate: user.subscription_start_date,
        subscriptionEndDate: user.subscription_end_date,
        planType: user.plan_type || 'monthly',
        receiptImage: user.receipt_image,
        submissionDate: user.submission_date,
        isAdmin: false, // Explicitly set isAdmin to false for active subscriptions
        password: '' // Required by type but not used
      })) || [];

      console.log('Mapped users:', mappedUsers);
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Detailed error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load active subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-gray-400">No active subscriptions</p>
        <p className="text-sm text-gray-500">Check console for debugging information</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-6">
        {users.map((user) => {
          const daysLeft = calculateDaysLeft(user.subscriptionEndDate);
          
          return (
            <div
              key={user.id}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <p className="text-gray-400">{user.email}</p>
                  {user.phoneNumber && (
                    <p className="text-gray-400">{user.phoneNumber}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  daysLeft > 7
                    ? 'bg-green-900/50 text-green-200 border border-green-700'
                    : 'bg-yellow-900/50 text-yellow-200 border border-yellow-700'
                }`}>
                  {daysLeft} days left
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                {user.subscriptionStartDate && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>Started: {new Date(user.subscriptionStartDate).toLocaleDateString()}</span>
                  </div>
                )}
                {user.subscriptionEndDate && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>Ends: {new Date(user.subscriptionEndDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">Plan:</span>
                <span className="text-sm font-medium text-blue-400">
                  {user.planType.charAt(0).toUpperCase() + user.planType.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}