import React, { useState } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { X, RefreshCw } from 'lucide-react';
import toast from '../utils/toast';

interface ClerkAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

export default function ClerkAuthModal({ isOpen, onClose, mode }: ClerkAuthModalProps) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { user } = useUser();
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register' && signUp) {
        await handleSignUp(e);
      }
      onClose();
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    try {
      if (!phoneNumber) {
        throw new Error('Please fill in all fields');
      }

      if (!receiptImage) {
        throw new Error('Please upload a payment receipt');
      }

      if (!name && mode === 'register') {
        throw new Error('Please enter your name');
      }

      // After successful Clerk sign-up, update the user metadata
      if (user) {
        await user.update({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          phoneNumbers: [{ phoneNumber }],
          publicMetadata: {
            planType: 'lifetime', // Set to lifetime by default
            receiptImage
          }
        });
      }
      
      // Close modal and show success message
      onClose();
      toast.success('Registration successful!');
    } catch (err) {
      console.error('Error in signup:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
      setError(''); // Clear any previous errors
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative border border-gray-700 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">
          Complete Your Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-200">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="e.g., +1234567890"
            />
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-200">
              Payment Receipt
            </label>
            <input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="mt-1 block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700"
              required
            />
            {receiptImage && (
              <div className="mt-2">
                <img
                  src={receiptImage}
                  alt="Receipt preview"
                  className="max-h-32 rounded border border-gray-600"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
