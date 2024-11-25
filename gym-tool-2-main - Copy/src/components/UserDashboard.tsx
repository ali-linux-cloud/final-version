import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import RenewalModal from './RenewalModal';
import SubscriptionModal from './SubscriptionModal';
import toast from '../utils/toast';
import { getUserData } from '../lib/clerk';
import { Dumbbell } from 'lucide-react';
import SearchBar from './SearchBar';
import MemberList from './MemberList';
import FloatingActionButton from './FloatingActionButton';
import Modal from './Modal';
import MemberForm from './MemberForm';
import ConfirmDialog from './ConfirmDialog';

export default function UserDashboard() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

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

  const handleRenewalClick = (member) => {
    setSelectedMember(member);
    setIsRenewalModalOpen(true);
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    // Implement delete confirmation dialog and functionality
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">PowerFit Pro</h1>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar onSearch={setSearchTerm} />
        <MemberList
          members={members.filter((member) =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          onRenew={handleRenewalClick}
          onDelete={handleDeleteClick}
        />
      </div>

      <FloatingActionButton onClick={() => setIsModalOpen(true)} />

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Member"
      >
        <MemberForm
          onSubmit={async (data) => {
            try {
              // Add member logic here
              setIsModalOpen(false);
            } catch (err) {
              console.error('Error adding member:', err);
              toast.error('Failed to add member');
            }
          }}
        />
      </Modal>

      {/* Renewal Modal */}
      {selectedMember && (
        <RenewalModal
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
          userId={user.id}
        />
      )}

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );
}
