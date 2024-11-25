import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import type { MemberFormData } from '../types/member';

interface MemberFormProps {
  onSubmit: (member: MemberFormData) => void;
}

const DURATION_OPTIONS = [
  { label: '15 days', value: 15 },
  { label: '1 month', value: 30 },
  { label: '2 months', value: 60 },
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
  { label: '1 year', value: 365 },
];

const PHONE_REGEX = /^[0-9]{10}$/;  // Assumes 10-digit phone numbers

export default function MemberForm({ onSubmit }: MemberFormProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    phoneNumber: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    duration: 30,
    price: 0,
  });

  const [startDatePicker, setStartDatePicker] = useState(new Date());
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('');
      return true;  // Empty phone number is valid
    }
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number if provided
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      return;
    }

    // Validate price
    if (formData.price <= 0) {
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      phoneNumber: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      duration: 30,
      price: 0,
    });
    setStartDatePicker(new Date());
    setPhoneError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);  // Only allow digits, max 10
    setFormData({ ...formData, phoneNumber: value });
    if (value.length === 10) {
      validatePhone(value);
    } else {
      setPhoneError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-200">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          minLength={2}
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200">Phone Number</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={handlePhoneChange}
          className={`mt-1 block w-full rounded-md bg-gray-800 border ${
            phoneError ? 'border-red-500' : 'border-gray-700'
          } text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Enter 10-digit phone number (optional)"
        />
        {phoneError && (
          <p className="mt-1 text-sm text-red-500">{phoneError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200">Start Date</label>
        <DatePicker
          selected={startDatePicker}
          onChange={(date: Date | null) => {
            if (date) {
              setStartDatePicker(date);
              setFormData({ ...formData, startDate: format(date, 'yyyy-MM-dd') });
            }
          }}
          dateFormat="dd/MM/yyyy"
          className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          placeholderText="Select start date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200">Duration</label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200">Price (DA)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Math.max(0, Number(e.target.value)) })}
          className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          min="0"
          step="100"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Add Member
      </button>
    </form>
  );
}