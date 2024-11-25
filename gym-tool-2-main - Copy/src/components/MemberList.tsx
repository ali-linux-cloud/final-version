import React, { useState } from 'react';
import { RefreshCw, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Member } from '../types/member';
import { formatCurrency, getDaysRemaining } from '../utils/memberUtils';
import ConfirmDialog from './ConfirmDialog';
import RenewalDialog from './RenewalDialog';
import { deleteMember, renewMember } from '../services/members';

interface MemberListProps {
  members: Member[];
  onRenew: (memberId: string, duration: number, price: number, startDate: string, endDate: string) => void;
  onDelete: (memberId: string) => void;
  filter: 'all' | 'active' | 'expired' | 'ending-soon';
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export default function MemberList({ members, onRenew, onDelete, filter }: MemberListProps) {
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [memberToRenew, setMemberToRenew] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (memberId: string) => {
    try {
      const { error: deleteError } = await deleteMember(memberId);
      if (deleteError) throw deleteError;
      onDelete(memberId);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Error deleting member:', err);
      setError('Failed to delete member. Please try again.');
    }
  };

  const handleRenew = async (
    memberId: string,
    duration: number,
    price: number,
    startDate: string,
    endDate: string
  ) => {
    try {
      const { success, error: renewError } = await renewMember(
        memberId,
        duration,
        price,
        startDate,
        endDate
      );
      if (renewError) throw renewError;
      if (success) {
        onRenew(memberId, duration, price, startDate, endDate);
        setMemberToRenew(null);
      }
    } catch (err) {
      console.error('Error renewing member:', err);
      setError('Failed to renew member. Please try again.');
    }
  };

  const filteredMembers = members.filter(member => {
    const daysLeft = getDaysRemaining(member.endDate);
    switch (filter) {
      case 'active':
        return daysLeft > 0;
      case 'expired':
        return daysLeft <= 0;
      case 'ending-soon':
        return daysLeft > 0 && daysLeft <= 7;
      default:
        return true;
    }
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 text-red-500 rounded-lg p-4 max-w-md mx-auto border border-red-500/20">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/50 rounded-lg p-8 max-w-md mx-auto border border-gray-700">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-white">No members found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {filter === 'all'
              ? 'Get started by adding your first member'
              : `No members found with the "${filter}" filter`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredMembers.map(member => {
          const daysLeft = getDaysRemaining(member.endDate);
          const isActive = daysLeft > 0;
          const isEndingSoon = isActive && daysLeft <= 7;
          const statusColor = isActive 
            ? isEndingSoon 
              ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
              : 'bg-green-500/20 text-green-500 border-green-500/50'
            : 'bg-red-500/20 text-red-500 border-red-500/50';
          
          return (
            <div
              key={member.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header with Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(member.name)} flex items-center justify-center`}>
                    <span className="text-white font-medium text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{member.name}</h3>
                    {member.phoneNumber && (
                      <p className="text-sm text-gray-400">{member.phoneNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                    {isActive 
                      ? isEndingSoon 
                        ? 'Ending Soon'
                        : 'Active'
                      : 'Expired'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMemberToRenew(member)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Renew membership"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => setMemberToDelete(member.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete member"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <span className="block text-gray-500">Start Date</span>
                  <span>{format(new Date(member.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="block text-gray-500">End Date</span>
                  <span>{format(new Date(member.endDate), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Duration</span>
                  <span>{member.duration} days</span>
                </div>
                <div>
                  <span className="block text-gray-500">Price</span>
                  <span>{formatCurrency(member.price)}</span>
                </div>
                {isActive && (
                  <div className="col-span-2">
                    <span className="block text-gray-500">Days Remaining</span>
                    <span className={isEndingSoon ? 'text-yellow-500' : ''}>
                      {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => memberToDelete && handleDelete(memberToDelete)}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
      />

      {/* Renewal Dialog */}
      {memberToRenew && (
        <RenewalDialog
          member={memberToRenew}
          onClose={() => setMemberToRenew(null)}
          onRenew={handleRenew}
        />
      )}
    </>
  );
}