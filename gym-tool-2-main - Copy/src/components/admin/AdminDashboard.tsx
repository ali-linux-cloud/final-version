import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Dumbbell } from 'lucide-react';
import SubscriptionRequests from './SubscriptionRequests';
import RenewalRequests from './RenewalRequests';
import ActiveSubscriptions from './ActiveSubscriptions';
import RejectedSubscriptions from './RejectedSubscriptions';
import ConfirmDialog from '../ConfirmDialog';
import toast from '../../utils/toast';
import { getUserData } from '../../lib/clerk';

type Tab = 'pending' | 'renewals' | 'active' | 'rejected';

export default function AdminDashboard() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  const userData = getUserData(user);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const tabs: { id: Tab; name: string }[] = [
    { id: 'pending', name: 'Pending Requests' },
    { id: 'renewals', name: 'Renewal Requests' },
    { id: 'active', name: 'Active Subscriptions' },
    { id: 'rejected', name: 'Rejected Requests' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {userData?.name}</span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'pending' && <SubscriptionRequests />}
          {activeTab === 'renewals' && <RenewalRequests />}
          {activeTab === 'active' && <ActiveSubscriptions />}
          {activeTab === 'rejected' && <RejectedSubscriptions />}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
    </div>
  );
}